/**
 * @file ExecutableDllPlugin allows to execute DllPlugin bundle when it is imported via a script tag into the page
 */

module.exports = class ExecutableDllPlugin {
  constructor(options) {
    this.options = options || {};
    this.name = 'ExecutableDllPlugin';
    this._entriesAdded = {}
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(this.name, compilation => {
      compilation.mainTemplate.hooks.startup.tap(this.name, (source, chunk) => {
        const requireFn = compilation.mainTemplate.requireFn;
        const filterChunkModules = this.options.filter || (m => {
          const execute = this.options.execute;
          if (execute) {
            return execute.includes(m.identifier());
          }
          return true;
        });
        const idList = [...chunk.modulesIterable]
          .filter(filterChunkModules)
          .map(m => m.id)
        const ids = idList.map(id => `'${id}'`).join(',');

        if (ids.length) {
          idList.forEach(id => this._entriesAdded[id] = true)
          return `[${ids}].forEach(${requireFn});\n\n` + source;
        }

        return source;
      });
    });
  }

  getEntriesAdded() {
    return Object.keys(this._entriesAdded)
  }
};
