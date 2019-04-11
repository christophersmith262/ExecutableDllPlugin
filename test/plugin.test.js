const webpack = require('webpack'),
  ExecutableDllPlugin = require('../lib/index'),
  path = require('path'),
  fs = require('fs')

async function runWebpack(caseName, plugins) {
  const srcPath = path.resolve(__dirname, 'src')

  return new Promise((accept, reject) => {
    webpack({
      mode: 'development',
      entry: {
        'entry1': [path.resolve(srcPath, 'entry1.js')],
        'entry2': [path.resolve(srcPath, 'entry2.js')],
      },
      output: {
        path: path.resolve(__dirname, 'output'),
        filename: `${caseName}-[name]-[hash].js`,
     },
      plugins: plugins,
    }).run((err, stats) => {
      if (err) {
        reject(err)
      }
      else if (stats.hasErrors()) {
        reject(new Error(stats.toString()))
      }
      else {
        accept(stats)
      }
    })
  })
}

async function testOptions(caseName, pluginOptions, expected) {
  const testPlugin = new ExecutableDllPlugin(pluginOptions)
  let stats = await runWebpack(caseName, [testPlugin])

  const files = stats.toJson().assets.map(x => x.name),
    basePath = path.resolve(__dirname, 'output')

  await expect(files.length).toBe(2)
  await expect(testPlugin.getEntriesAdded()).toEqual(expected)
}

function resetTests() {
  fs.readdirSync(path.resolve(__dirname, 'output')).forEach(file => {
    if (file == '.gitkeep') {
      return
    }

    fs.unlinkSync(path.join(path.resolve(__dirname, './output'), file))
  });
}

beforeAll(resetTests)
afterAll(resetTests)

test('Adds entrypoints with no options provided', async () => {
  await testOptions('empty', undefined, ['0', '1', './test/src/entry1.js', './test/src/entry2.js'])
})

test('Respects the execute option', async () => {
  await testOptions('empty', {
    execute: [path.resolve(`${__dirname}/src`, 'entry1.js')],
  }, ['./test/src/entry1.js'])
})

test('Respects the filter option', async () => {
  await testOptions('filter', {
    filter: m => [path.resolve(`${__dirname}/src`, 'entry1.js')].includes(m.resource),
  }, ['./test/src/entry1.js'])
})
