var client = require('../../config/redis'),
  _ = require('underscore'),
  noop = function() {}

exports.isExist = function(key, callback) {
  return client.exists(key, callback)
}

exports.get = function(key, callback) {
  client
    .get(key)
    .then(function(data) {
      if (data) {
        callback(null, JSON.parse(data))
      } else {
        callback()
      }
    })
    .catch(function(err) {
      callback(err)
    })
}

exports.set = function(key, value, times, callback) {
  if (typeof times === 'function') {
    callback = times
    times = undefined
  }
  callback = callback || function() {}
  value = JSON.stringify(value)
  if (times) {
    client.setex(key, times, value, callback)
  } else {
    client.set(key, value, callback)
  }
}

exports.del = function(key, callback) {
  return client.del(key, callback)
}

//list
exports.push = function(key, value, callback) {
  value = JSON.stringify(value)
  callback = callback || noop
}

//hash
exports.hget = function(key, field, callback) {
  client.hget(key, field, function(err, data) {
    if (err) {
      return callback(err)
    }
    if (data) {
      callback(null, JSON.parse(data))
    } else {
      callback()
    }
  })
}

exports.hset = function(key, field, value, callback) {
  value = JSON.stringify(value)
  callback = callback || noop
  client.hset(key, field, value, callback)
}

exports.hdel = function(key, field, callback) {
  callback = callback || noop
  client.hdel(key, field, callback)
}

exports.hvals = function(key, callback) {
  client.hvals(key, function(err, vals) {
    if (err) {
      callback(err)
    }
    if (vals) {
      vals = _.map(vals, JSON.parse)
    }
    callback(err, vals)
  })
}

exports.client = client
