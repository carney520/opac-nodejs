var BookType = require('../../models/index').BookType;


exports.before = function(req,res,next){
  res.locals.action_path = req.url_for('rules');
  next();
};

exports.index = function(req,res,next){
  BookType.all()
  .then(function(rules){
    res.render('rule/index',{rules:rules});
  })
  .catch(function(err){
    next(err);
  });
};

exports.new = function(req,res,next){
  res.render('rule/new',{
    //默认值
    max_number_loan:15,
    max_days_loan:30,
    max_times_renewals:1,
    max_days_renewals:30,
    reservation_threshold:1,
    reservation_expire:7
  });
};

exports.edit = function(req,res,next){
  var id = req.params.id;
  BookType.getById(id)
    .then(function(rule){
      if(rule){
        res.locals.isEdit = req.url_for('rule',id);
        res.render('rule/new',rule);
      }else{
        next();
      }
    })
  .catch(function(err){
    next(err);
  });
};

exports.create = function(req,res,next){
  book_type_params(req,function(err,params){
      //401 bad request
      if(err){
        err.render = 'rule/new';
        err.locals = req.body;
        err.flash = err.message;
        return next(err);
      }

      BookType.create(params)
        .then(function(product){
          res.format({
            json:function(){
              res.status(201).json({
                code:201,
                message:'created',
                id:product.id
              });
            },
            html:function(){
              req.flash('success','已创建' + product.name);
              res.redirect(303,req.url_for('rules'));
            }
          });
        })
      .catch(function(err){
        err.render = 'rule/new';
        err.locals = params;
        err.flash = err.message;
        next(err);
      });
    });
};

exports.update = function(req,res,next){
  var id = req.params.id;
  book_type_params(req,function(err,params){
      if(err){
        res.locals.isEdit = req.url_for('rule',id);
        err.render = 'rule/new';
        err.locals = req.body;
        err.flash = err.message;
        return next(err);
      }
      BookType.updateById(id,params)
        .then(function(rule){
          if(rule){
            res.format({
              json:function(){
                res.json({code:200,message:'updated',id:rule.id});
              },
              html:function(){
                req.flash('success','修改成功');
                res.redirect(req.url_for('rules'));
              }
            });
          }else{
            //not found
            next();
          }
        })
      .catch(function(err){
        res.locals.isEdit = req.url_for('rule',id);
        err.flash = err.message;
        err.render = 'rule/new';
        err.locals = params;
        next(err);
      });
    });
};

exports.show = function(req,res,next){
  var id = req.params.id;
  BookType.getById(id)
    .then(function(rule){
      if(rule){
        res.render('rule/show',{rule:rule});
      }else{
        next();
      }
    })
  .catch(function(err){
    next(err);
  });
};

exports.destroy = function(req,res,next){
  var id = req.params.id;
  BookType.removeById(id)
    .then(function(rule){
      if(rule){
        res.format({
          json:function(){
            res.json({code:200,message:'deleted',id:id,name:rule.name});
          },
          html:function(){
            req.flash('success','已删除');
            res.redirect(303,req.url_for('rules'));
          }
        });
      }else{
        next();
      }
    })
  .catch(function(err){
    next(err);
  });
};


/* private methods */

//params filter
var book_type_params = function(req,cb){
  req.filter.require('name','max_number_loan','max_days_loan','max_times_renewals',
      'max_days_renewals','reservation_threshold','reservation_expire','penalty')
    .done(cb);
};
