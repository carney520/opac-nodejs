module.exports = function(app){
  var locals = app.locals;
  locals.miniAssets = app.get('mini_assets');
  locals.staticHost = app.get('site_static_host');
};
