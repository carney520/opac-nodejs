/*
 *
 * 图书管理子系统
 *
 *
 */
var passport = require('passport');
//子系统路径前缀
exports.prefix = '/library';

//子系统前置过滤器
exports.before = [
  //视图帮助方法
  function(req,res,next){
    passport._viewHelper(['super','admin'],
        req.url_for('library_login'),req.url_for('main_logout'))(
        req,res,next);
  },

  //授权
  function(req,res,next){
    if(req.path.endsWith('login')){
      return next();
    }
    passport._authorization(['super','admin'],req.url_for('library_login'))(
        req,res,next);
  },

  function(req,res,next){
    var locals = res.locals;
    locals.navs = [
      {name: '图书管理',
        url: req.url_for('intl_books')
      }
    ];
    if(req.user){
      var role = req.user.role;
      if(role === 'super'){
        locals.nav.push({name:'系统管理',url:req.url_for('system')});
      }
    }
    next();
  }
];

exports.index = function(req,res,next){
  res.redirect(301,req.url_for('intl_books'));
};

exports.login = function(req,res,next){
  if(req.user && (req.user.role === 'super' || req.user.role === 'admin')){
    //已经登录
    res.redirect(303,req.url_for('library'));
  }else{
    res.render('login',
        {role:'admin',action_path:req.url_for('library_login')});
  }
};


exports.authentication = function(req,res,next){
  passport._authentication(
      req.url_for('library'),req.url_for('library_login')
      )(req,res,next);
};

//控制器
exports.book = require('./book');
exports.collection = require('./collection');
