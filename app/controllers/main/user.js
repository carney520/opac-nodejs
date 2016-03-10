var models = require('../../models/index'),
    Reader = models.Reader,
    BookFavorite = models.BookFavorite,
    BookComment = models.BookComment,
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
    reader: Reader.findOne({card_no:card_no})
  })
  .then(function(results){
    if(results.reader){
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
