var credentials = require('./credentials')
var path = require('path')

var config = {
  //organization infomation
  organization: 'tianliao school',
  organization_zh: '田寮学校',
  email: 'ivy@pan.com',
  //website name
  name: 'Online Public Access Catalog',
  description: 'library online public access catalog',
  keywords: 'opac',

  site_headers: ['<meta name="referrer" content="always"/>'],
  site_logo: '',

  host: 'localhost',
  port: 3000,
  mini_assets: false, //是否合并静态资源文件
  site_static_host: '', //静态文件存储域名,比如CDN

  //material
  default_avatar: '/images/default_avatar.jpg', //默认头像,保存在/public/images
}

module.exports = function(app) {
  for (var key in config) {
    app.set(key, config[key])
  }
  app.set('appPath', path.join(__dirname, '../'))
  //set up credentials
  app.set('credentials', {
    cookie: credentials.cookieSecret,
    session: credentials.sessionSecret,
    mongo: credentials.mongo[app.get('env')],
    redis: credentials.redis[app.get('env')],
  })
}
