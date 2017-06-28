/*用于统一处理错误
 * 错误类型：
 *      + 表述错误：缺乏必要参数
 *      + 数据库错误:
 *         + 模型错误
 *         + 验证错误
 *         + 键重复
 *      + 安全
 *         + csrf Token 验证失败
 *         + 认证失败
 *         + 授权失败
 *
 * 约定: 根据error对象的属性来选择响应HTTP代码
 *   status -  可选的响应的HTTP代码
 *   code   -  错误代码，包括mongodb的错误代码
 *   message - 错误信息
 *   redirect - 重定向的目标地址,如果存在则进行重定向
 *   flash -  重定向的flash信息
 *   render - 渲染的模版，它与redirect选项是互斥的，只能选择其中一个
 *   locals - 渲染的参数
*/

module.exports = function(err, req, res, next) {
  var isRedirect = err.redirect,
    redirect_url = err.redirect,
    view = err.render,
    flash = err.flash,
    locals = err.locals,
    code = err.code,
    status = err.status || 200, //默认响应代码为200
    message = err.message,
    default_json = {
      //默认的json响应主体
      code: code,
      message: message,
    }

  //设置flash消息

  res.format({
    //响应 html
    html: function() {
      if (code === 11000) {
        status = 409
      } else if (code === 401) {
        status = 401
      } else {
        //unknow error
        return next(err)
      }

      //set up flash
      if (flash) {
        if (isRedirect) req.flash('danger', flash)
        else {
          res.locals.flash = res.locals.flash || []
          res.locals.flash.push({ type: 'danger', message: flash })
        }
      }

      if (isRedirect) {
        //重定向
        res.redirect(redirect_url)
      } else if (view) {
        //渲染
        res.status(status).render(view, locals)
      } else {
        //未知错误
        next(err)
      }
    },

    //响应 json
    json: function() {
      //401 bad request
      if (code === 401) {
        //请求缺少必要参数
        default_json.param = err.param
      } else if (code === 11000) {
        //mongodb key dupicate
        status = 409 //conflit
      } else {
        //未知错误
        return next(err)
      }
      res.status(status).json(default_json)
    },
  })
}
