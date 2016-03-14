var models = require('../../models/index'),
    Reader = models.Reader,
    BookFavorite = models.BookFavorite,
    BookComment = models.BookComment,
    BookBorrowed = models.BookBorrowed,
    BookType = models.BookType, 
    Promise = require('bluebird'),
    _ = require('underscore');


//读者主页
exports.show = function(req,res,next){
  var card_no = req.params.card_no;
  Promise.props({
    favorites:BookFavorite.find({user_id:card_no})
      .limit(10).sort("-collection_date"),
    comments: BookComment.find({'user.id':card_no,deleted:false})
      .limit(10).sort("-created_on"),
    borroweds:BookBorrowed.find({user_id:card_no,status:'returned'})
      .limit(10).sort("-created_at"),
    reader: Reader.findOne({card_no:card_no})
  })
  .then(function(results){
    if(results.reader){
      isMyself(req,res,card_no);
      res.render('user/show',results);
    }else{
      next();
    }
  })
  .catch(function(err){
    next(err);
  });
};

exports.update = function(req,res,next){
  var card_no = req.params.card_no;
  if(!isMyself(req,res,card_no)){
    res.status(403).json({code:403,message:'forbidden'});
  }
  req.filter.permit('email','tel','mobile','signature','introduce')
    .done(function(err,params){
      if(err){
        return next(err);
      }
      params.introduce = params.introduce.replace(/\n/g,'<br/>');
      Reader.findOneAndUpdate({card_no:card_no},params)
        .then(function(product){
          if(product){
            res.format({
              json:function(){
                res.json({code:200,message:'updated',card_no:product.card_no});
              },
              html:function(){
                req.flash('success','修改成功');
                res.redirect(req.url_for('user',product.card_no));
              }
            });
          }else{
            next();
          }
        })
      .catch(function(err){
        next(err);
      });
    });
};

exports.change_password = function(req,res,next){
  var card_no = req.params.card_no;
  if(!isMyself(req,res,card_no)){
    res.status(403).json({code:403,message:'forbidden'});
  }
  req.filter.require('old_password','new_password','verify_password')
    .done(function(err,params){
      if(params.new_password !== params.verify_password){
        res.format({
          json:function(){
            res.status(400).json({code:400,message:'password inconsistent'});
          },
          html:function(){
            req.flash('danger','密码不一致');
            res.redirect(req.url_for('user',card_no));
          }
        });
      }
      Reader.findOne({card_no:card_no})
        .then(function(product){
          if(product){
            //check password
            if(!product.validPassword(params.old_password)){
              res.format({
                json:function(){
                  res.status(400).json({code:400,message:'invaild password'});
                },
                html:function(){
                  req.flash('danger','密码错误');
                  res.redirect(req.url_for('user',card_no));
                }
              });
            }else{
              //change password
              product.password = params.new_password;
              return product.save();
            }
          }else{
            next();
          }
        })
      .then(function(product){
        if(product){
          res.format({
            json:function(){
              res.json({code:200,message:'updated'});
            },
            html:function(){
              req.flash('success','密码修改成功');
              res.redirect(req.url_for('user',product.card_no));
            }
          });
        }
      })
      .catch(function(err){next(err);});
    });
};

/* 获取借阅信息
 * @params {Boolean} history - 可选，获取借阅历史
 * @params {Number} start - 与history配合进行分页
 * @params {Number} count - 与history配合进行分页
 */

exports.get_borrowed = function(req,res,next){
  var card_no = req.params.card_no,
      user = req.user;
  if(!isMyself(req,res,card_no)){
    res.status(403).json({code:403,message:'forbidden'});
  }
  req.filter
    .permit('history','start','count') //借阅历史可能很多,需要分页获取
    .done(function(err,params){
      if(err) return next(err);
      if(params.history){
        //获取借阅历史
        var start = Number.parseInt(params.start) || 0,
            count = Number.parseInt(params.count) || 20;
        Promise.props({
          total:BookBorrowed.count({user_id:card_no,status:'returned'}),
          results:BookBorrowed.find({user_id:card_no,status:'returned'})
                  .sort('-created_at')
                  .skip(start)
                  .limit(count)
        })
          .then(function(result){
            var records = result.results;
            var results = [];
            if(records){
              records.forEach(function(record){
                results.push(_.omit(record.toObject(),'_id','__v','penalty'));
              });
            }
            res.json({
              code: 200,
              message: 'success',
              start: start,
              count: results.length,
              total: result.total,
              results: results});
          })
        .catch(function(err){
          next(err);
        });
      }else{
        //获取当前借阅
        BookBorrowed.find({user_id:card_no,status:{$ne:'returned'}})
          .sort('-created_at')
          .then(function(records){
            var results = [];
            if(records){
              var promises = [];
              //取出前进行检查,处理记录
              records.forEach(function(record){
                var result = {};
                _.extend(result,_.omit(record.toObject(),'_id','__v','penalty'));

                if(record.status !== 'overdue'){
                  //检查是否超期
                  var now = Date.now(),
                      due_date = new Date(record.due_date).getTime();
                  if(due_date <= now){
                    result.status = 'overdue';
                    record.status = 'overdue';
                    promises.push(record.save());
                  }
                }
                results.push(result);
              });
              if(promises.length > 0){
                return Promise.all(promises);
              }
            }
            res.json({code:200,message:'success',results:results});
          })
        .then(function(results){
          if(results){
            console.log('修改用户状态成功');
          }
        })
        .catch(function(err){
          if(res.headersSent)
            console.log(err);
          else
            next(err);
        });
      }
    });
};

exports.renew = function(req,res,next){
  var card_no = req.params.card_no,
      accession_no =req.params.accession_no;
  if(!isMyself(req,res,card_no)){
    res.status(403).json({code:403,message:'forbidden'});
  }
  //1 判断是否超期
  //2 是否超过可续借次数
  //3 成功则加上可续借天数
  Promise.props({
    types: BookType.all(),
    record: BookBorrowed.findOne({
      user_id:card_no,
      accession_no:accession_no,
      status:{$ne:'returned'}
    })
  })
  .then(function(results){
    if(results.record){
      var types = _.indexBy(results.types,'name'),
          record = results.record,
          type = types[record.type],
          max_days_renewals = type.max_days_renewals,   //可续借的天数
          max_times_renewals = type.max_times_renewals, //可续借的次数
          renewals_times = record.renewals_times,       //已续借次数
          due_date = new Date(record.due_date);

      if(due_date.getTime() <= Date.now()){
        //过期
        res.status(403).json({code:403,message:'overdue'});
      }else if(renewals_times === max_times_renewals){
        res.status(403).json({code:403,message:'renewal time limit reached'});
      }else{
        record.renewals_times += 1;
        record.due_date = due_date.setTime(due_date.getTime() + max_days_renewals*one_day);
        return record.save();
      }
    }else{
      next();
    }
  })
  .then(function(record){
    if(record){
      res.json({code:200,message:'success',result:_.omit(record.toObject(),'_id','penalty','__v')});
    }
  })
  .catch(function(err){
    next(err);
  });
};

/* 判断是否是本人 */
var isMyself = function(req,res,card_no){
  if(req.user && req.user.card_no === card_no){
    res.locals.myself = true;
    return true;
  }else{
    res.locals.myself = false;
    return false;
  }
};

var one_day = 1000*60*60*24;
