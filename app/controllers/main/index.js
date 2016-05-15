/*
 *
 * 公共服务入口
 *
 */

var passport = require('passport');
var Acl = require('resourceful-acl');
var composition = require('./composition');

//访问控制列表
var acl = new Acl({
  default:{   //默认角色
    'index':'view',
    'books':'view',
    'login':{
      path:/^\/login/,
      methods:'*'
    },
    'logout':{
      path:/^\/logout/,
      methods:'get'
    },
    'users':'view' //禁止的资源设置为null
  },
  'reader':{
    extends:'default',
    resources:{
      'users':['view','edit']
    }
  },
  'admin':{
    extends:'reader'
  },
  'super':{
    extends:'admin'
  }
});

//子系统路径前缀
exports.prefix = '/';  //根目录

//子系统前置过滤器：比如验证和一些子系统的全局设置以及登录控制器
exports.before = [
  //视图帮助方法
  //为视图提供 login_url 登录链接，如果期望角色的用户登录后可以提供
  //  user,logined,logout_url，is{role} 等帮助方法
  function(req,res,next){
    passport._viewHelper('reader',
        req.url_for('main_login'),req.url_for('main_logout'))(
        req,res,next);
  },
  //授权,使用访问控制列表授权
  function(req,res,next){
    acl.authorize(function(err){
      if(err){
        req.flash('danger','请先登录');
        res.redirect(303,req.url_for('main_login'));
      }else{
        next();
      }
    })(req,res,next);
  },

  function(req,res,next){
    var locals = res.locals;
    locals.navs = [
      {name:'主页',
        url:req.url_for('main')
      },
      {name:'图书检索',
        url:req.url_for('books')
      }
    ];

    if(req.user){
      var role = req.user.role;
      switch(role){
        case 'reader':
          locals.navs.push({name:'个人中心',url:req.url_for('user',req.user.card_no)});
          break;
        case 'admin':
          locals.navs.push({name:'图书管理',url:req.url_for('library')});
          break;
        case 'super':
          locals.navs.push({name:'系统管理',url:req.url_for('system')});
      }
    }
    next();
  }
];

//主页面
exports.index = composition.index;

//登录界面
exports.login = function(req,res,next){
  var redirectUrl = req.url_for('main');
  if(req.query.redirectTo){
    redirectUrl = req.query.redirectTo;
  }
  //测试是否登录
  if(req.user && req.user.role === 'reader'){
    res.redirect(303,redirectUrl);
  }else{
    res.render('login',
        {
          role:'reader',
          action_path:req.url_for('main_login'),
          redirect_to:redirectUrl
        });
  }
};

exports.logout = function(req,res,next){
  passport._logout(req.url_for('main')
      )(req,res,next);
};

exports.authentication = function(req,res,next){
  var redirectUrl = req.body.redirect_to || req.url_for('main');
  passport
    ._authentication(
        redirectUrl,req.url_for('main_login')
        )(req,res,next);
};

//杂项
exports.sitemap = function(req,res,next){
  res.render('sitemap');
};
//控制器
exports.user = require('./user');
exports.tag = require('./tag');
exports.book = require('../library/book');
exports.comment = require('./comment');
exports.reservation = require('./reservation');
