var models = require('../app/models/index'),
  cache = require('../app/models/cache'),
  Reader = models.Reader,
  Admin = models.Admin,
  passport = require('passport'),
  express = require('express'),
  req = express.request,
  _ = require('underscore'),
  LocalStrategy = require('passport-local').Strategy

req.touchUser = function() {
  if (this.user) {
    var key = 'users:' + this.user.role + ':' + this.user.id,
      role = this.user.role,
      userid = this.user.id

    var recache = function(err, user) {
      if (user) {
        cache.set(key, user, 60 * 60 * 24)
      }
    }
    switch (role) {
      case 'reader':
        Reader.findById(userid, recache)
        break
      case 'admin':
      case 'super':
        Admin.findById(userid, recache)
        break
    }
  }
}

//session 序列化
passport.serializeUser(function(user, done) {
  //缓存 users:role:id
  var key = 'users:' + user.role + ':' + user.id
  cache.set(key, user, 60 * 60 * 24)
  done(null, key)
})

passport.deserializeUser(function(id, done) {
  var keys = id.split(':'),
    role = keys[1]

  //获取缓存
  cache
    .isExist(id)
    .then(function(result) {
      if (result === 1) {
        return cache.client.get(id)
      } else {
        done(null, false)
      }
    })
    .then(function(user) {
      if (!user) {
        return done(null, false)
      }
      user = JSON.parse(user)
      switch (role) {
        case 'reader':
          done(null, new Reader(user))
          break
        case 'admin':
        case 'super':
          done(null, new Admin(user))
          break
      }
    })
    .catch(function(err) {
      done(err)
    })
})

//认证策略
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true,
    },
    function(req, username, password, done) {
      var role = req.body.role
      //TODO 验证码
      switch (role) {
        case 'reader':
          //读者认证
          Reader.findOne()
            .or([{ name: username }, { card_no: username }])
            .then(function(user) {
              if (user && user.validPassword(password)) {
                //用户存在 检查密码
                done(null, user, { message: '登录成功' })
              } else {
                done(null, false, { message: '用户不存在或密码不正确' })
              }
            })
            .catch(function(err) {
              done(err)
            })
          break

        //图书管理员认证
        case 'admin':
          Admin.findOne()
            .and([
              { role: 'admin' },
              { $or: [{ name: username }, { card_no: username }] },
            ])
            .then(function(user) {
              if (user && user.validPassword(password)) {
                done(null, user, { message: '登录成功' })
              } else {
                done(null, false, { message: '用户不存在或密码不正确' })
              }
            })
            .catch(function(err) {
              done(err)
            })
          break

        //系统管理员认证
        case 'super':
          Admin.findOne()
            .and([
              { role: 'super' },
              { $or: [{ name: username }, { card_no: username }] },
            ])
            .then(function(user) {
              if (user && user.validPassword(password)) {
                done(null, user, { message: '登录成功' })
              } else {
                done(null, false, { message: '用户不存在或密码不正确' })
              }
            })
            .catch(function(err) {
              done(err)
            })
          break
        default:
          done(null, false, { message: 'Bad Request 登入失败' })
      }
    }
  )
)

//放在body parse 和 session之后
module.exports = function(app) {
  app.use(passport.initialize())
  app.use(passport.session())
}

//monkey patch
passport._authentication = function(successRedirect, failRedirect) {
  return function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) {
        return next(err)
      } //认证出错
      if (!user) {
        //认证失败
        return res.format({
          json: function() {
            res.status(401).json({
              code: 401,
              message: 'Unauthorized:unkown username or invaild password',
            })
          },
          html: function() {
            req.flash('danger', info.message)
            return res.redirect(failRedirect)
          },
        })
      }
      //认证成功,保存会话信息
      return req.login(user, function(err) {
        if (err) return next(err)
        res.format({
          json: function() {
            res.json({ code: 200, message: 'authenticated' })
          },
          html: function() {
            req.flash('success', info.message)
            return res.redirect(successRedirect)
          },
        })
      })
    })(req, res, next)
  }
}

passport._logout = function(redirectUrl) {
  return function(req, res, next) {
    req.logout()
    req.flash('success', '退出登录成功')
    res.redirect(redirectUrl)
  }
}

//提供一些试图帮助方法
passport._viewHelper = function(expectRoles, loginUrl, logoutUrl) {
  if (_.isString(expectRoles)) {
    expectRoles = [expectRoles]
  }

  return function(req, res, next) {
    var user = req.user
    res.locals.login_url = loginUrl

    if (user && user.role && _.includes(expectRoles, user.role)) {
      //已登录和授权
      _.extend(res.locals, {
        user: user,
        logined: true,
        logout_url: logoutUrl,
      })
    }
    if (user && user.role) {
      res.locals['is_' + user.role] = true
    }
    next()
  }
}

passport._authorization = function(expectRoles, failRedirect) {
  if (_.isString(expectRoles)) {
    expectRoles = [expectRoles]
  }
  return function(req, res, next) {
    var user = req.user
    if (user && _.includes(expectRoles, user.role)) {
      //授权通过
      next()
    } else {
      res.format({
        json: function() {
          res.status(403).json({ code: 403, message: 'forbidden' })
        },
        html: function() {
          res.redirect(303, failRedirect)
        },
      })
    }
  }
}
