var _ = require('underscore'),
  Promise = require('bluebird'),
  cache = require('./cache'),
  client = cache.client

/*
 * 缓存保存一个数据上次更新的时间戳，为一些数据缓存检验是否以及过时
 * {modelName}:updatedAt
 */

/* 模型属性组成的集合
 *
 * @redis-data-structure - SET
 * @param {String} name - 对象的属性名
 * @return {Array}
 */

exports.fieldList = function(name) {
  var Model = this
  var modelName = Model.modelName //模型的名字
  var keyName = modelName + ':' + name //保存的键名
  var lastUpdateTimeStamp = modelName + ':updatedAt'
  var lastPullOutTimeStamp = modelName + ':' + name + '.timestamp'

  return new Promise(function(resolve, reject) {
    //从模型属性中抽取出所需字段
    var pullOut = function() {
      // 判断是否存在模型的缓存
      cache.isExist(modelName, function(err, result) {
        if (err) return reject(err)
        //首先清空集合
        cache.del(keyName)
        if (result === 1) {
          //从模型缓存中抽取
          cache.hvals(modelName, function(err, vals) {
            if (err) return reject(err)
            if (vals) {
              console.log(modelName + '从缓存中取出数据')
              vals = _.pluck(vals, name)
              cache.client.sadd(keyName, vals)
              cache.set(lastPullOutTimeStamp, Date.now())
            }
            resolve(vals)
          })
        } else {
          //从数据库中抽取
          Model.find()
            .select(name) //筛选出的字段
            .exec()
            .then(function(values) {
              //缓存数据
              if (!_.isEmpty(values)) {
                console.log(modelName + '取出数据')
                values = _.pluck(values, name)
                cache.client.sadd(keyName, values)
                cache.set(lastPullOutTimeStamp, Date.now())
              }
              resolve(values)
            })
            .catch(function(err) {
              reject(err)
            })
        }
      })
    }

    //检查是否缓存
    cache.isExist(keyName, function(err, result) {
      if (err) reject(err)
      if (result === 1) {
        //键存在
        //检查是否老于数据库
        cache.client
          .mget(lastUpdateTimeStamp, lastPullOutTimeStamp)
          .then(function(results) {
            if (results[0] && results[0] > results[1]) {
              //数据过时
              console.log('过时')
              pullOut()
            } else {
              //取出数据
              console.log(modelName + '命中缓存')
              cache.client.smembers(keyName, function(err, values) {
                if (err) return reject(err)
                resolve(values)
              })
            }
          })
          .catch(function(err) {
            reject(err)
          })
      } else {
        //不存在，读出缓存
        pullOut()
      }
    })
  })
}

/*
 * 创建数据对象并缓存
 * @param {Object} params - 创建模型的数据
 * @param {String} keyfield - 作为redis Hash 键的模型属性,默认为id
 */

exports.create = function(params, keyfield) {
  var Model = this,
    modelName = Model.modelName, //模型的名字
    keyName = modelName, //保存的键名
    lastPullOutTimeStamp = modelName + '.timestamp'
  lastUpdateTimeStamp = modelName + ':updatedAt'
  keyfield = keyfield || 'id'

  return new Promise(function(resolve, reject) {
    new Model(params)
      .save()
      .then(function(product) {
        //创建缓存
        cache.hset(keyName, product[keyfield], product)
        //更新时间戳
        cache.set(lastUpdateTimeStamp, Date.now())
        cache.set(lastPullOutTimeStamp, Date.now())
        resolve(product)
      })
      .catch(function(err) {
        reject(err)
      })
  })
}

/*
 * @param {Object} doc - 查询对象
 * @param {String} keyfield - 作为redis Hash键的属性
 */

exports.getOne = function(doc, keyfield) {
  var Model = this
  var modelName = Model.modelName //模型的名字
  var keyName = Model.modelName //保存的键名

  keyfield = keyfield || 'id' //默认按id查询
  if (keyfield !== 'id') {
    //模型的hash 键按id组织，如果请求的键不是‘id’属性的话，使用其他键保存
    keyName += '.' + keyfield
  }
  var query = null
  return new Promise(function(resolve, reject) {
    cache.hget(keyName, doc[keyfield], function(err, data) {
      if (err) return reject(err)
      if (data) {
        //命中缓存
        resolve(new Model(data))
      } else {
        //查询数据库
        if (keyfield === 'id') {
          //findById
          query = Model.findById(doc.id)
        } else {
          query = Model.findOne(doc)
        }
        query
          .then(function(data) {
            if (data) {
              cache.hset(keyName, data[keyfield], data)
            }
            resolve(data)
          })
          .catch(function(err) {
            reject(err)
          })
      }
    })
  })
}

exports.getById = function(id) {
  return exports.getOne.call(this, { id: id }, 'id')
}

exports.getByName = function(name) {
  return exports.getOne.call(this, { name: name }, 'name')
}

exports.removeOne = function(doc, keyfield) {
  var Model = this
  var modelName = Model.modelName //模型的名字
  var keyName = modelName //保存的键名
  var lastUpdateTimeStamp = modelName + ':updatedAt'
  var lastPullOutTimeStamp = modelName + '.timestamp'
  var query = null
  return new Promise(function(resolve, reject) {
    if (keyfield === 'id') {
      query = Model.findByIdAndRemove(doc.id)
    } else {
      query = Model.findOneAndRemove(doc)
    }
    query
      .exec()
      .then(function(data) {
        if (data) {
          //已从数据库中删除
          cache.hdel(keyName, data[keyfield])
          cache.set(lastUpdateTimeStamp, Date.now())
          cache.set(lastPullOutTimeStamp, Date.now())
        }
        resolve(data)
      })
      .catch(function(err) {
        reject(err)
      })
  })
}

exports.removeById = function(id) {
  return exports.removeOne.call(this, { id: id }, 'id')
}

exports.updateOne = function(doc, keyfield, params) {
  var Model = this,
    modelName = Model.modelName, //模型的名字
    keyName = modelName, //保存的键名
    lastUpdateTimeStamp = modelName + ':updatedAt',
    lastPullOutTimeStamp = modelName + '.timestamp',
    query = null,
    options = { new: true }

  return new Promise(function(resolve, reject) {
    if (keyfield === 'id') {
      query = Model.findByIdAndUpdate(doc.id, params, options)
    } else {
      query = Model.findOneAndUpdate(doc, params, options)
    }
    query
      .exec()
      .then(function(data) {
        if (data) {
          //已从数据库更新
          cache.hset(keyName, data[keyfield], data)
          console.log('更新缓存', data)
          cache.set(lastUpdateTimeStamp, Date.now())
          cache.set(lastPullOutTimeStamp, Date.now())
        }
        resolve(data)
      })
      .catch(function(err) {
        reject(err)
      })
  })
}

exports.updateById = function(id, params) {
  return exports.updateOne.call(this, { id: id }, 'id', params)
}

exports.all = function(doc, keyfield, projection) {
  var Model = this,
    modelName = Model.modelName, //模型的名字
    keyName = modelName,
    lastUpdateTimeStamp = modelName + ':updatedAt'
  lastPullOutTimeStamp = keyName + '.timestamp' //保存的键名

  keyfield = keyfield || 'id'
  return new Promise(function(resolve, reject) {
    cache.isExist(keyName, function(err, result) {
      if (err) return reject(err)
      cache.client
        .mget(lastUpdateTimeStamp, lastPullOutTimeStamp)
        .then(function(results) {
          var lastUpdate = results[0],
            lastPullOut = results[1]
          if (result === 1 && lastPullOut >= lastUpdate) {
            cache.hvals(keyName, function(err, values) {
              if (err) return reject(err)
              if (values) {
                values = _.map(values, function(value) {
                  return new Model(value)
                })
              }
              resolve(values)
            })
          } else {
            //过时或者键不存在
            console.log(modelName + '过时')
            Model.find(doc, projection)
              .then(function(values) {
                if (values) {
                  var pipeline = cache.client.pipeline()
                  pipeline.del(keyName)
                  values.forEach(function(value) {
                    pipeline.hset(
                      keyName,
                      value[keyfield],
                      JSON.stringify(value)
                    )
                  })
                  pipeline.exec(_.noop)
                }
                cache.set(lastUpdateTimeStamp, Date.now())
                cache.set(lastPullOutTimeStamp, Date.now())
                resolve(values)
              })
              .catch(function(err) {
                reject(err)
              })
          }
        })
        .catch(function(err) {
          reject(err)
        })
    })
  })
}

//手动更新时间戳
exports.cacheTouch = function() {
  var Model = this,
    modelName = Model.modelName, //模型的名字
    lastUpdateTimeStamp = modelName + ':updatedAt'
  cache.set(lastUpdateTimeStamp, Date.now())
}

/* 增加一个值，等到达一个阈值后回写*/
exports.incrWriteBack = function(
  id,
  key,
  writeBack,
  initialize,
  incrValue,
  threshold
) {
  var Model = this,
    modelName = Model.modelName,
    keyName = modelName + ':' + id

  incrValue = incrValue || 1
  threshold = threshold || 5
  return client
    .hget(keyName, key) //测试是否存在
    .then(function(result) {
      if (!result) {
        //键不存在
        return Promise.resolve(initialize).then(function(value) {
          if (value) {
            console.log('键不存在，设置键', value)
            return client.hset(keyName, key, value)
          }
        })
      }
    })
    .then(function() {
      return client.hincrby(keyName, key, incrValue).then(function(value) {
        console.log('增加键', value)
        if (value % threshold === 0) {
          console.log('回写', value)
          writeBack(value, id, key)
        }
        return value
      })
    })
}

/* 获取增加的值 */
exports.getIncr = function(id, key) {
  var Model = this,
    modelName = Model.modelName,
    keyName = modelName + ':' + id

  return cache.client.hget(keyName, key)
}

//TODO 关闭时，缓存回写,不要依赖于缓存
