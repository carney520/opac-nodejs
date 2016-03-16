var models = require('../../models/index'),
    Reader = models.Reader,
    Book = models.Book,
    BookType = models.BookType,
    BookReservation = models.BookReservation,
    Promise = require('bluebird'),
    _ = require('underscore');

//创建预约
exports.create = function(req,res,next){
  var bookid = req.params.id;
  req.filter.require('user_id')
    .done(function(err,params){
      if(err) return next(err);
      var book,user,queue,types;
      //验证
      if(!authorize(req,res,params.user_id)){
        return;
      }
      //首先获取相关信息
      Promise.props({
        book:Book.findById(bookid),
        user:Reader.findOne({card_no:params.user_id}),
        queue: BookReservation.find({book_id:bookid}).sort('reservation_date'),
        types: BookType.all()
      })
      .then(function(results){
        if(results){
          book = results.book;
          user = results.user;
          queue = results.queue;
          types = _.indexBy(results.types,'name');

          if(!book){
            return res.status(404).json({
              code:404,message:'Book not found',err:'book'});
          }
          if(!user){
            return res.status(404).json({
              code:404,message:'User not found',err:'user'});
          }

          //检查有没有预约的必要
          var type = types[book.type];
          //计算需求
          if((book.availables - queue.length) > type.reservation_threshold){
            //无需借阅
            return res.status(406).json({
              code:406,message:'Need no reservate'
            });
          }

          //检查是否预约过了
          if(!_.isEmpty(queue) && _.find(queue,function(v){return v.user_id === user.card_no;})){
            return res.status(409).json({code:409,message:'Alreay reservated'});
          }

          //处理预约队列,删除失效预约以及调度给下一个预约者
          var now = Date.now(),
              promises = [],
              book_availables = 0; //失效的预约数
          queue.forEach(function(reservation){
            if(reservation.book_available){
              //正在等待取回的预约
              //检查是否失效
              var latest_loan_date = new Date(reservation.latest_loan_date);
              if(latest_loan_date.getTime() <= now){
                //失效,让给下一个预约者,如果没有则通知管理员将图书放回书库
                //删除失效预约，并通知读者图书已经失效
                promises.push(reservation.remove());
                //TODO 通知失效者
                console.log(reservation.user_name + '预约的图书已经失效');
                book_availables += 1;
              }
            }else{
              //正在等待的预约
              if(book_availables > 0){
                //有预约已经失效了，启用正在等待的预约
                reservation.book_available = true;
                reservation.book_available_date = new Date();
                reservation.latest_loan_date = new Date();//最后取书的时间
                reservation.latest_loan_date.setTime(now + type.reservation_expire* one_day);
                //TODO 通知预约读者
                console.log('图书让给' + reservation.user_name);
                promises.push(reservation.save());
                book_availables -= 1;
              }
            }
          });

          //新建预约队列
          var newReservation = new BookReservation({
            user_id:user.card_no,
            user_name: user.name,
            book_id: book.id,
            book:{
              name:book.name,
              author:book.author.join(','),
              book_type:book.type
            }
          });

          if(book_availables > 0){
            //有失效的预约可以让给当前的预约者
            newReservation.book_available = true;
            newReservation.book_available_date = new Date();
            newReservation.latest_loan_date = new Date();
            newReservation.latest_loan_date.setTime(now + type.reservation_expire*one_day);
            book_availables -= 1;
            //TODO 通知预约者
          }

          if(book_availables > 0){
            //TODO 预约书柜有书籍冗余，通知管理员
            //TODO 恢复空闲
          }
          promises.push(newReservation.save());
          return Promise.all(promises);
        }
      })
      .then(function(reservation){
        if(_.isArray(reservation)){
          //创建成功
          res.json({code:200,message:'created',queue:queue.length});
        }
      })
      .catch(function(err){
        next(err);
      });
    });
};

//获取用户的预约队列
exports.show = function(req,res,next){
  var card_no = req.params.card_no,
      book_id = req.params.id;
  req.filter
    .permit('user_id','book_id')
    .done(function(err,params){
      if(err) return next(err);
      var userid = params.user_id || card_no,
          bookid = params.book_id || book_id,
          promise;

      if(!authorize(req,res,userid)){
        return;
      }

      if(userid && bookid){
        //获取特定图书的预约
        promise = BookReservation.findOne({user_id:userid,book_id:bookid});
      }else{
        promise = BookReservation.find({user_id:userid})
          .sort('reservation_date');
      }

      promise
        .then(function(reservations){
          if(_.isArray(reservations)){
            res.json({code:200,message:'success',
              reservations:_.map(reservations,function(v){
                return _.omit(v.toObject(),'_id','__v');})
            });
          }else if(_.isObject(reservations)){
            res.json({code:200,message:'success',
              reservation:_.omit(reservations.toObject(),'_id','__v')});
          }else{
            res.status(404).json({code:404,message:'not found'});
          }
        })
      .catch(function(err){
        next(err);
      });
    });
};


//取消预约
exports.destroy = function(req,res,next){
  var card_no = req.params.card_no,
      book_id = req.params.id;
  req.filter.permit('user_id','book_id')
    .done(function(err,params){
      if(err) return next(err);
      var userid = params.user_id || card_no,
          bookid = params.book_id || book_id;

      if(!authorize(req,res,userid)){
        return;
      }

      BookReservation.remove({user_id:userid,book_id:bookid})
        .then(function(){
          res.json({code:200,message:'deleted'});
        })
        .catch(function(){
          next(err);
        });
    });
};

//验证是否是本人操作
var authorize = function(req,res,userid){
  if(!req.user){
    //需要登录
    res.status(401).json({code:401,message:'unauthorized'});
    return false;
  }
  if(req.user && (req.user.card_no != userid)){
    res.status(403).json({code:403,message:'forbidden'});
    return false;
  }
  return true;
};

var one_day = 1000*60*60*24;
