/* 全局信息*/
module.exports = function(app) {
  var locals = app.locals
  locals.organization = app.get('organization')
  locals.organizationZh = app.get('organization_zh')
  locals.email = app.get('email')
  locals.appName = app.get('name')
  locals.appDescription = app.get('description')
  locals.appKeyWords = app.get('keywords')
  locals.siteHeaders = app.get('site_headers')
  locals.siteLogo = app.get('site_logo')
  locals.year = new Date().getFullYear()
  //...
}
