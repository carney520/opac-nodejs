var models = require('../../models/index'),
    Book = models.Book,
    BookBorrowed = models.BookBorrowed,
    BookReservation = models.BookReservation,
    Reader = models.Reader,
    BookType = models.BookType,
    _ = require('underscore'),
    Promise = require('bluebird');


//借出
exports.create = function(req,res,next){
  borrowed_params(req,function(err,params){
    if(err) return next(err);
    var accession_no = params.accession_no,
        card_no = params.card_no,
        book_id = params.book_id,
        reader,       //读者
        types,       //图书类型,即借阅规则
        records,
        last_status,
        reservation,
        capacity = {};    //图书可借容量

    //1 读取读者信息
    Reader.findOne({card_no:card_no})
      .then(function(product){
        if(product){
          reader = product;
          var status = reader.status;
          switch(status){
            //读者以及被注销
            case 'logout':
              res.status(403).json({code:403,message:'Reader was logout',err:'logout'});
              break;
            case 'normal':
              return Promise.props({
                records: BookBorrowed.find({
                    user_id:card_no,
                    status:{$ne:'returned'}
                  })
                  .select({type:1,created_at:1,due_date:1,status:1}),
                types: BookType.all(),
                reservation: BookReservation.findOne({
                  book_id:book_id,user_id:card_no})
              });
          }
        }else{
          res.status(404).json({code:404,message:'Reader not found',err:'reader'});
        }
      })
    .then(function(result){
      if(result){
        types = _.indexBy(result.types,'name');
        records = result.records;
        reservation = result.reservation;
        var promises = [];

        //分析借阅记录,检查是否有超期书籍
        var now = Date.now();
        records.forEach(function(value){
          var due_date = new Date(value.due_date).getTime();
          if(due_date <= now){
            //图书超期
            if(value.status === 'overdue'){
              promises.push('overdue'); //简单填充，说明有超期书籍
              return;
            }

            value.status = 'overdue';
            promises.push(value.save());
          }
        });

        if(promises.length > 0){
          //有超期书籍
          return Promise.all(promises);
        }else{
          //没有超期书籍，分析可借空间
          var count = _.countBy(records,function(value){return value.type;});
          _.forEach(types,function(v,k){
            var max_number_loan = v.max_number_loan,
                current_loan = count[k] || 0;
            capacity[k] = max_number_loan - current_loan;
          });
          //获取图书信息
          return Book.findOne({_id:book_id,'books.accession_no':accession_no});
        }
      }
    })
    .then(function(results){
      if(results){
        if(_.isArray(results)){
          //Promise.all
          res.status(403).json({code:403,message:'account was overdue',err:'overdue'});
        }else{
          //Book.findOne
          var book = results,
              book_type = book.type,
              collection = _.find(book.books,function(value){return value.accession_no === accession_no;});
          last_status = collection.status;

          //图书已被借出
          if(collection.status === 'lent_out'){
            res.status(409).json({code:409,message:'book lent out',accession_no:accession_no,err:'lentout'});
            return;
          }

          //读者可以借出图书
          if(capacity[book_type] > 0){
            book.availables -= 1;
            collection.status = 'lent_out';
            //记录借出数
            book.statistics_info.borrow_count +=1;
            var promises = [];
            if(reservation){
              //当前借阅者是本书的预约者，自动删除预约记录
              promises.push(reservation.remove());
            }else{
              promises.push(null); //填充作用
            }
            promises.push(book.save());
            return Promise.all(promises);
          }else{
            res.status(403).json({code:403,message:'capacity full',err:'full',type:book_type});
          }
        }
      }else{
        if(!res.headersSent)
          res.status(404).json({code:404,message:'Book not found',err:'book'});
      }
    })
    .then(function(results){
      var book = results && results[1];
      if(book){
        var type = types[book.type],
            max_days_loan = type.max_days_loan,
            due_date = new Date().setTime(Date.now() + max_days_loan*one_day);
        //现在可以创建借出记录了
        new BookBorrowed({
          user_id: reader.card_no,
          book_id: book.id,
          name: book.name,
          accession_no:accession_no,
          type: book.type,
          due_date: due_date,              //超期日期
          penalty: type.penalty,
          max_times_renewals: type.max_times_renewals
        }).save()
        .then(function(borrowed){
          //成功借阅
          res.json({code:200,message:'success',card_no:card_no,accession_no:accession_no,book:_.pick(book,'name','author','publisher','_id')});
        })
        .catch(function(err){
          //创建失败，mongodb 不支持事务，这里需要对book进行恢复
          var collection = _.find(book.books,function(value){return value.accession_no === accession_no;});
          collection.status = last_status;
          book.availables += 1;
          book.save(function(error,product){
            if(error)
              return next(error);
            //借阅失败
            next(err);
          });
        });
      }
    })
    .catch(function(err){
      if(res.headersSent){
        console.log(err);
      }else
        next(err);
    });
  });
};


//归还
exports.destroy = function(req,res,next){
  var accession_no = req.params.accession_no;
  req.filter.require('book_id')
    .permit('amount')
    .done(function(err,params){
    if(err) return next(err);
    var book_id = params.book_id,
        record,
        reservation,
        book,
        type,
        amount = Number.parseInt(params.amount) || 0,
        collection;

    //读取图书信息
    Book.findOne({_id:book_id,'books.accession_no':accession_no})
      .then(function(product){
        if(product){
          book = product;
          collection = _.find(book.books,function(value){return value.accession_no === accession_no;});
          if(collection.status !== 'lent_out'){
            //已经归还，无须归还
            res.json({code:200,message:'Book alreay returned',err:'returned'});
          }else{
            //读取借阅记录,和借阅规则
            return Promise.props({
              borrowed: BookBorrowed.findOne({
                accession_no:accession_no,
                status:{$ne:'returned'}
              }),
              reservation: BookReservation.peek(book.id),
              types: BookType.all()
            });
          }
        }else{
          res.status(404)
            .json({code:404,message:'Book not found',err:'book'});
        }
      })
    .then(function(results){
      var promises = [];
      record = results.borrowed;
      reservation = results.reservation.shift();
      type = _.indexBy(results.types,'name')[book.type];
      if(record){
        var penalty = record.penalty;
        //计算是否超期
        var now = Date.now(),
            overdue_date = new Date(record.due_date).getTime(),
            interval = now - overdue_date,
            //计算超出金额
            totalPenalty = Math.floor(interval / one_day) * penalty;

        if(interval > 0 && totalPenalty > 0){
          //超期,需要扣费
          if(amount != totalPenalty){
            //扣费失败
            res.status(402).json({code:402,message:'payment required',amount:totalPenalty,err:'payment'});
            return;
          }
        }

        //没有超期或完成扣费
        record.status = 'returned';
        record.return_date = new Date();
        promises.push(record.save());
        if(reservation){
          //TODO 存在预约,消息通知预约者取书
          reservation.book_available = true;
          reservation.book_available_date = new Date();
          reservation.latest_loan_date = new Date();//最后取书的时间
          reservation.latest_loan_date.setTime(Date.now() + type.reservation_expire* one_day);
          console.log('notice '+reservation.user_name +'to get book'+reservation.book.name);
          promises.push(reservation.save());
        }
        return Promise.all(promises);
      }else if(!res.headersSent && !record){
        //没有找到借阅记录,即已经归还
        res.json({code:200,message:'Book alreay returned',err:'returned'});
      }
    })
    .then(function(results){
      if(results){
        //修改记录成功
        book.availables+=1;
        if(reservation){
          collection.status = 'reserved';
        }else{
          collection.status = 'free';
        }
        book.save()
          .then(function(book){
            //成功归还
            //TODO 通知管理员放入特定书柜
            res.json({
              code:200,
              message:'success',
              card_no:record.user_id,
              book:_.pick(book,'name','author','publisher','_id'),
              reserved: reservation ? true : false,
            });
          })
        .catch(function(err){
          //恢复borrowed
          record.status = 'lent_out';
          record.save(function(error){
            if(error)
              return next(error);
            next(err);
          });
        });
      }
    })
    .catch(function(err){
      next(err);
    });
  });
};

//续借
exports.update = function(req,res,next){
};

//获取借阅记录
exports.show = function(req,res,next){
};

var borrowed_params = function(req,callback){
  req.filter.require(
      'accession_no',
      'card_no',
      'book_id'
      )
    .done(callback);
};

var one_day = 1000*60*60*24;
