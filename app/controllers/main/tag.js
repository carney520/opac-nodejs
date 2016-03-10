var models = require('../../models/index'),
    Reader = models.Reader,
    Book = models.Book,
    cache  = require('../../models/cache'),
    Promise = require('bluebird'),
    BookFavorite = models.BookFavorite,
     _ = require('underscore');

//获取用户收藏的所有图书
exports.index = function(req,res,next){
  req.filter
    .permit('start','count')
    .done(function(err,params){
      var start = Number.parseInt(params.start) || 0,
          count = Number.parseInt(params.count) || 20,
          card_no = req.params.card_no;

      Promise.props({
        start: start,
        total: BookFavorite.find({user_id:card_no}).count(),
        collections: BookFavorite.find({user_id:card_no})
          .select({_id:0,user_id:0})
          .skip(start)
          .limit(count)
          .sort('-collection_date')
      })
      .then(function(data){
        data.user_id = card_no;
        data.count = data.collections.length;
        res.json(data);
      })
      .catch(function(err){
        next(err);
      });
    });
};

exports.tags = function(req,res,next){
  var card_no = req.params.card_no;
  if(req.user && req.user.tags){
    return res.json({
      code:200,
      message:'got',
      tags:req.user.tags,
      user_id:card_no
    });
  }else{
    Reader.findOne({card_no:card_no})
      .then(function(product){
        if(product){
          res.json({
            code:200,
            message:'got',
            tags:product.tags,
            user_id:card_no
          });
        }else{
          next();
        }
      })
    .catch(function(err){
      next(err);
    });
  }
};

exports.create = function(req,res,next){
  var card_no = req.params.card_no;
  req.filter
    .require('tags','book_id','book_name')
    .permit('notes')
    .done(function(err,params){
      if(err){
        return next(err);
      }
      //先将标签写入用户档案
      //将缓存失效
      Reader.findOneAndUpdate({card_no:card_no},{$addToSet:{tags:{$each:params.tags}}})
        .then(function(product){
          if(product){
            req.touchUser();
            //成功写入用户档案
            return new BookFavorite(
                {
                  _id:card_no+'_'+params.book_id,
                  user_id:card_no,
                  book_id:params.book_id,
                  name:params.book_name,
                  tags:params.tags,
                  notes:params.notes
                }).save();
          }else{
            next();
          }
        })
      .then(function(bookFavor){
        if(bookFavor){
          //成功写入
          //添加收藏次数
          Book.incrMarkCount(params.book_id);
          res.json({code:200,
            message:'collected',
            userid:card_no,
            bookid:params.book_id});
        }
      })
      .catch(function(err){
        next(err);
      });
    });
};

exports.destroy = function(req,res,next){
  var userid = req.params.card_no,
      bookid = req.params.book_id;
  BookFavorite.findByIdAndRemove(userid+'_'+bookid)
    .then(function(product){
      if(product){
        //deleted
        Book.incrMarkCount(bookid,-1);
        //不能删除Reader中的tags
        res.json({
          code:200,
          message:'deleted',
          user_id:product.user_id,
          book_id:product.book_id
        });
      }else{
        next();
      }
    })
  .catch(function(err){
    next(err);
  });
};

//获取指定标签的书
exports.show = function(req,res,next){
  var card_no = req.params.card_no,
      tag_name = req.params.tag_name;
  BookFavorite.find({user_id:card_no,tags:tag_name})
    .sort('-collection_date')
    .select({_id:0,user_id:0,__v:0})
    .then(function(books){
      //删除空标签
      if(books.length === 0){
        Reader.findOneAndUpdate({card_no:card_no},{$pull:{tags:tag_name}})
          .then(function(product){
            if(product) req.touchUser();
          });
      }
      res.json(books);
    })
  .catch(function(err){
    next(err);
  });
};

exports.is_collected = function(req,res,next){
  var userid = req.params.card_no,
      bookid = req.params.book_id;
  BookFavorite.findOne({user_id:userid,book_id:bookid})
    .then(function(product){
      if(product){
        res.json({code:200,message:'collected'});
      }else{
        res.status(404).json({code:404,message:'non-existend'});
      }
    })
  .catch(function(err){
    next(err);
  });
};
