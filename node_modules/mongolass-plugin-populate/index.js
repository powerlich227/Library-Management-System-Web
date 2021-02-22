const _ = require('lodash')

module.exports = {
  afterAggregate: function (results, opts) {
    opts = Array.isArray(opts) ? opts : [opts]
    return Promise.all(opts.map(opt => bindPopulate.call(this, results, opt)))
      .then(() => results)
  },
  afterFind: function (results, opts) {
    opts = Array.isArray(opts) ? opts : [opts]
    return Promise.all(opts.map(opt => bindPopulate.call(this, results, opt)))
      .then(() => results)
  },
  afterFindOne: function (result, opts) {
    opts = Array.isArray(opts) ? opts : [opts]
    return Promise.all(opts.map(opt => bindPopulate.call(this, [result], opt)))
      .then(() => result)
  }
}

function bindPopulate(results, opt) {
  if (!opt.path || !opt.model) {
    throw new TypeError('No .populate path or model')
  }
  if (!results.length) {
    return results
  }

  let keys = []
  // populate array
  _.forEach(results, (result) => {
    const refes = _.get(result, opt.path)
    if (Array.isArray(refes)) {
      keys = keys.concat(refes)
    } else {
      keys.push(refes)
    }
  })
  keys = _.compact(keys)
  // empty path, return
  if (!keys.length) {
    return results
  }

  let query = opt.match || {}
  let options = {}
  let omitId = false
  query._id = { $in: keys }
  if (opt.select) {
    options.projection = opt.select
    if (options.projection._id === 0) {
      omitId = true
      if (Object.keys(options.projection).length > 1) {
        options.projection._id = 1
      } else {
        delete options.projection._id
      }
    }
  }
  let model = ('string' === typeof opt.model) ? this._model.model(opt.model, null, opt.options) : opt.model
  return model
    .find(query, options)
    .exec()
    .then(populates => {
      return _.reduce(populates, function(obj, value) {
        obj[value._id.toString()] = value
        return obj
      }, {})
    })
    .then(obj => {
      _.forEach(results, result => {
        let refes = _.get(result, opt.path)
        // array
        if (Array.isArray(refes)) {
          _.forEach(refes, (refe, index) => {
            try { refe = refe.toString() } catch (e) {}
            if (refe && obj[refe]) {
              if (omitId) delete obj[refe]._id
              if (typeof opt.as === 'string') {
                _.set(result, `${opt.as}[${index}]`, obj[refe])
                _.unset(result, `${opt.path}[${index}]`)
              } else {
                _.set(result, `${opt.path}[${index}]`, obj[refe])
              }
            }
          })
        } else {
          try { refes = refes.toString() } catch (e) {}
          if (refes && obj[refes]) {
            if (omitId) delete obj[refes]._id
            if (typeof opt.as === 'string') {
              _.set(result, opt.as, obj[refes])
              _.unset(result, opt.path)
            } else {
              _.set(result, opt.path, obj[refes])
            }
          }
        }
      })

      return results
    })
}
