var models = require('../../models/index'),
  BookComment = models.BookComment,
  Book = models.Book,
  Promise = require('bluebird'),
  _ = require('underscore')

//获取当前书籍的所有评论
exports.index = function(req, res, next) {
  var bookid = req.params.id
  BookComment.find({ book_id: bookid })
    .sort('comment_id')
    .select({ _id: 0, __v: 0 })
    .then(function(products) {
      res.json({
        code: 200,
        message: 'success',
        comments: products,
      })
    })
    .catch(function(err) {
      next(err)
    })
}

// 创建一条评论
exports.create = function(req, res, next) {
  var bookid = req.params.id
  req.filter
    .require(
      'book_name',
      'content', //评论内容
      'rank', //星级
      'user_id' //用户id
    )
    .permit('reply_id', 'reply_user_id', 'reply_user_name') // 回复的楼层，用户
    .done(function(err, params) {
      if (err) return next(err)
      //回复的楼层以及用户不是必须的,默认为空
      var reply_id = params.reply_id || null,
        reply_user_id = params.reply_user_id || null
      reply_user_name = params.reply_user_name || null

      //验证是否是本人操作
      if (!authorize(req, res, params.user_id)) {
        return
      }

      //如果是回复楼层，则忽略其评级
      if (reply_id) {
        params.rank = 0
      }

      //获取已有的评论数,来确定当前评论的楼层
      var count = null
      BookComment.getRepliesNumber(bookid)
        .then(function(_count) {
          count = Number.parseInt(_count)
          if (!count) {
            count = 1
          } else {
            count += 1
          }
          return new BookComment({
            book_name: params.book_name,
            comment_id: count,
            reply_id: reply_id,
            book_id: bookid,
            user: {
              id: req.user.card_no,
              name: req.user.name,
              avatar: req.user.avatar,
            },
            reply_user: {
              id: reply_user_id,
              name: reply_user_name,
            },
            content: params.content,
            rank: params.rank,
          }).save()
        })
        .then(function(product) {
          if (product) {
            // TODO 消息通知:通知被回复的用户
            //增加评论数
            Book.incrRepliesCount(product.book_id, 1, count - 1)
            //增加评级数
            if (product.rank > 0) BookComment.incrScoringCount(product.book_id)
            res.status(201).json({
              code: 201,
              message: 'created',
              comment: _.omit(product, '_id', '__v', 'book_id'),
            })
          }
        })
        .catch(function(err) {
          next(err)
        })
    })
}

//删除指定楼数的回复
exports.destroy = function(req, res, next) {
  var bookid = req.params.id,
    comment_id = req.params.reply_no

  req.filter.require('user_id').done(function(err, params) {
    if (err) return next(err)
    if (!authorize(req, res, params.user_id)) {
      return
    }

    //确保删除的楼层是用户自己的
    BookComment.findOneAndUpdate(
      { book_id: bookid, comment_id: comment_id, 'user.id': req.user.card_no },
      {
        deleted: true,
        $set: {
          user: null,
          reply_user: null,
          content: null,
          reply_id: null,
          ups: [],
        },
      }
    )
      .then(function(product) {
        if (product) {
          res.json({ code: 200, message: 'deleted' })
        } else {
          next()
        }
      })
      .catch(function(err) {
        next(err)
      })
  })
}

//赞功能
exports.like = function(req, res, next) {
  var bookid = req.params.id,
    comment_id = req.params.reply_no
  req.filter.require('user_id').done(function(err, params) {
    if (err) return next(err)

    if (!authorize(req, res, params.user_id)) {
      //不是登录用户操作
      return
    }

    BookComment.findOne({ book_id: bookid, comment_id: comment_id })
      .then(function(comment) {
        //确定回复是否存在
        if (comment) {
          //检查是否赞过
          if (_.includes(comment.ups, params.user_id)) {
            res.status(409).json({
              code: 409,
              message: 'conflict',
              user_id: params.user_id,
            })
          } else {
            //添加赞
            comment.ups.addToSet(params.user_id)
            return comment.save()
          }
        } else {
          next()
        }
      })
      .then(function(value) {
        if (value) {
          // TODO 消息通知
          res.status(201).json({
            code: 201,
            message: 'created',
            user_id: params.user_id,
            value: value.ups.length,
          })
        }
      })
      .catch(function(err) {
        next(err)
      })
  })
}

//取消赞功能
exports.undo_like = function(req, res, next) {
  var bookid = req.params.id,
    comment_id = req.params.reply_no,
    user_id = req.params.card_no
  //检查用户
  if (!authorize(req, res, user_id)) {
    return
  }
  BookComment.findOneAndUpdate(
    { book_id: bookid, comment_id: comment_id },
    { $pull: { ups: user_id } }
  )
    .then(function(comment) {
      if (comment) {
        res.json({
          code: 200,
          message: 'success',
          user_id: user_id,
          value: comment.ups.length - 1,
        })
      } else {
        next()
      }
    })
    .catch(function(err) {
      next(err)
    })
}

//验证是否是本人操作
var authorize = function(req, res, userid) {
  if (!req.user) {
    //需要登录
    res.status(401).json({ code: 401, message: 'unauthorized' })
    return false
  }
  if (req.user && req.user.card_no != userid) {
    res.status(403).json({ code: 403, message: 'forbidden' })
    return false
  }
  return true
}
