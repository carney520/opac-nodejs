var Reader = require('../../models/index').Reader
var _ = require('underscore')

exports.before = function(req, res, next) {
  res.locals.action_path = req.url_for('readers')
  next()
}
//显示所有reader
exports.index = function(req, res, next) {
  Reader.find()
    .sort({ created_at: -1 })
    .select({
      name: 1,
      card_no: 1,
      avatar: 1,
      created_at: 1,
      status: 1,
      notes: 1,
    })
    .exec()
    .then(function(readers) {
      res.locals.readers = readers
      res.render('reader/index')
    })
    .catch(function(err) {
      next(err)
    })
  //res.render('reader/index');
}

//创建reader 的页面
exports.new = function(req, res, next) {
  res.render('reader/new')
}

exports.edit = function(req, res, next) {
  var card_no = req.params.card_no
  Reader.findOne({ card_no: card_no })
    .then(function(reader) {
      if (reader) {
        res.locals.isEdit = req.url_for('reader', card_no)
        res.render('reader/new', reader)
      } else {
        next()
      }
    })
    .catch(function(err) {
      next(err)
    })
}

exports.create = function(req, res, next) {
  reader_params(req, function(err, params) {
    if (err) {
      res.locals.flash = [{ type: 'danger', message: err.message }]
      return res.render('reader/new', req.body)
    }

    params.password = params.password || params.card_no //默认密码
    params.avatar = req.app.get('default_avatar') //默认头像
    new Reader(params)
      .save()
      .then(function(product) {
        req.flash('info', '已创建 ' + product.name)
        res.redirect(303, req.url_for('readers'))
      })
      .catch(function(err) {
        //已存在
        if (err.code === 11000) {
          res.locals.flash = [{ type: 'danger', message: 'card_no duplicate' }]
          res.render('reader/new', params)
        } else next(err)
      })
  })
}

exports.update = function(req, res, next) {
  var card_no = req.params.card_no
  reader_params(req, function(err, params) {
    if (err) {
      err.render = 'reader/new'
      err.locals = params
      err.flash = err.message
      return next(err)
    }
    Reader.findOneAndUpdate({ card_no: card_no }, params)
      .then(function(reader) {
        req.flash('info', '修改成功')
        res.redirect(req.url_for('readers'))
      })
      .catch(function(err) {
        if (err.code === 11000) {
          res.locals.isEdit = req.url_for('reader', card_no)
          res.locals.flash = [{ type: 'danger', message: 'card_no duplicate' }]
          params.card_no = card_no
          res.render('reader/new', params)
        } else next(err)
      })
  })
}

exports.show = function(req, res, next) {
  var card_no = req.params.card_no
  Reader.findOne({ card_no: card_no })
    .then(function(reader) {
      if (reader) {
        res.locals.reader = reader
        res.render('reader/show')
      } else {
        next() //not found
      }
    })
    .catch(function(err) {
      next(err)
    })
}

//支持Ajax
exports.destroy = function(req, res, next) {
  var card_no = req.params.card_no
  Reader.findOneAndRemove({ card_no: card_no })
    .then(function(reader) {
      if (reader)
        res.status(200).json({
          code: 200,
          message: 'deleted',
          card_no: card_no,
          name: reader.name,
        })
      else {
        next() //not found
      }
    })
    .catch(function(err) {
      next(err)
    })
}

exports.change_reader_status = function(no, status, cb) {
  //TODO 启用的时候要检查用户是否超期
  Reader.findOneAndUpdate({ card_no: no }, { status: status })
    .then(function(reader) {
      cb(null, reader)
    })
    .catch(function(err) {
      cb(err)
    })
}

exports.update_status = function(req, res, next) {
  var card_no = req.params.card_no
  req.filter.require('status').done(function(err, params) {
    if (err) {
      //bad request
      next(err)
    }
    exports.change_reader_status(card_no, params.status, function(err, reader) {
      if (err) {
        next(err)
      } else {
        res.format({
          json: function() {
            res.json({
              code: 200,
              current_status: reader.status,
            })
          },
          html: function() {
            req.flash('info', params.status === 'logout' ? '已禁用' : '已启用')
            res.redirect('/readers/' + reader.card_no)
          },
        })
      }
    })
  })
}

/* private methods */

//params filter
var reader_params = function(req, cb) {
  req.filter
    .require('name', 'card_no')
    .permit('email', 'tel', 'mobile', 'notes', 'password')
    .done(cb)
}
