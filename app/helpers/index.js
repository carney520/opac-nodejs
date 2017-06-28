var appInfo = require('./info'),
  assets = require('./assets'),
  methods = require('./methods')

//accept app to append view helper to Response object
module.exports = function(app) {
  //全局作用域view 帮助方法
  appInfo(app)
  assets(app)
  methods(app)

  //请求作用域view帮助方法
  app.use(function(req, res, next) {
    var locals = res.locals
    //csrfToken
    locals.csrfToken = req.csrfToken()

    next()
  })
}
