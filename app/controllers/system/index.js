/*
 *
 * 系统管理子系统，控制器
 *
 */

var passport = require('passport')

//子系统路径前缀
exports.prefix = '/system'

//子系统前置过滤器：比如验证和一些子系统的全局设置以及登录控制器
exports.before = [
  //视图帮助方法
  function(req, res, next) {
    passport._viewHelper(
      'super',
      req.url_for('system_login'),
      req.url_for('main_logout')
    )(req, res, next)
  },

  //授权:访问系统管理部分需要超级管理员权限
  function(req, res, next) {
    //白名单
    if (req.path.endsWith('login')) {
      return next()
    }
    passport._authorization('super', req.url_for('system_login'))(
      req,
      res,
      next
    )
  },

  function(req, res, next) {
    //导航
    res.locals.navs = [
      {
        name: '读者管理',
        url: req.url_for('readers'),
      },
      {
        name: '管理员管理',
        url: req.url_for('admins'),
      },
      {
        name: '借阅规则管理',
        url: req.url_for('rules'),
      },
      {
        name: '藏书位置管理',
        url: req.url_for('collection_sites'),
      },
      {
        name: '图书分类管理',
        url: req.url_for('categories'),
      },
    ]
    next()
  },
]

//主页面
exports.index = function(req, res, next) {
  res.redirect(301, req.url_for('readers'))
}

//登录界面
exports.login = function(req, res, next) {
  //测试是否登录
  if (req.user && req.user.role === 'super') {
    res.redirect(303, req.url_for('system'))
  } else {
    res.render('login', {
      role: 'super',
      action_path: req.url_for('system_login'),
    })
  }
}

//认证控制器
exports.authentication = function(req, res, next) {
  passport._authentication(req.url_for('system'), req.url_for('system_login'))(
    req,
    res,
    next
  )
}

//导出控制器
exports.reader = require('./reader')
exports.admin = require('./admin')
exports.rule = require('./rule')
exports.collectionSite = require('./collection_site')
exports.category = require('./category')
