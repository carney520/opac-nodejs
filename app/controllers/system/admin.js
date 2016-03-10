//模型
var Admin = require('../../models/index').Admin;

exports.before = function(req,res,next){
  res.locals.action_path = req.url_for('admins');
  next();
};
//显示所有admin
exports.index = function(req,res,next){
  Admin.find()
    .sort({created_at:-1})
    .select({name:1,card_no:1,avatar:1,created_at:1,notes:1,role:1})
    .exec()
    .then(function(admins){
      res.locals.admins = admins;
      res.render('admin/index');
    })
  .catch(function(err){
    next(err);
  });
};

//创建管理员界面
exports.new = function(req,res,next){
  res.render('admin/new');
};

//编辑管理员页面
exports.edit = function(req,res,next){
  var card_no = req.params.card_no;
  Admin.findOne({card_no:card_no})
    .then(function(admin){
      if(admin){
        //edit 和 new 共享同一个模板
        res.locals.isEdit = req.url_for('admin',card_no);
        res.render('admin/new',admin);
      }else{
        next();
      }
    })
  .catch(function(err){
    next(err);
  });
};

//管理员信息页面
exports.show = function(req,res,next){
  var card_no = req.params.card_no;
  Admin.findOne({card_no:card_no})
    .then(function(admin){
      if(admin){
        res.locals.admin = admin;
        res.render('admin/show');
      }else{
        next();
      }
    })
  .catch(function(err){
    next(err);
  });
};

//创建用户
exports.create = function(req,res,next){
  admin_params(req,function(err,params){
      if(err){
        //bad request
        next(err);
      }
      params.password = params.password || params.card_no;  //默认密码
      params.avatar = req.app.get('default_avatar');         //默认头像
      new Admin(params).save()
        .then(function(product){
          req.flash('info','已创建 ' + product.name);
          res.redirect(303,req.url_for('admins'));
        })
      .catch(function(err){
        if(err.code === 11000){
          res.locals.flash=[{type:'danger',message:'card_no duplicate'}];
          res.render('admin/new',params);
        }else
          next(err);
      });
    });
};

exports.update = function(req,res,next){
  var card_no = req.params.card_no;
  admin_params(req,function(err,params){
      if(err){
        //bad request
        next(err);
      }
      Admin.findOneAndUpdate({card_no:card_no},params)
        .then(function(admin){
          res.format({
            json:function(){
              res.json({code:201,message:'created',
                card_no:admin.card_no,
                name:admin.name});
            },
            html:function(){
              res.flash('success','修改成功');
              res.redirect(303,req.url_for('admins'));
            }
          });
        })
      .catch(function(err){
        if(err.code === 11000 ){
          res.locals.isEdit = req.url_for('admin',card_no);
          res.locals.flash=[{type:'danger',message:'card_no duplicate'}];
          params.card_no = card_no;
          res.render('admin/new',params);
        }else{
          next(err);
        }
      });
    });
};

exports.destroy = function(req,res,next){
  var card_no = req.params.card_no;
  Admin.findOneAndRemove({card_no:card_no})
    .then(function(admin){
      if(admin){
        res.status(200).json({code:200,message:'deleted',card_no:card_no,name:admin.name});
      }else{
        next(); //not found
      }
    })
  .catch(function(err){
    next(err);
  });
};

/* private methods */

//params filter
var admin_params = function(req,cb){
  req.filter.require('name','card_no')
    .permit('email','tel','mobile','notes','password','role')
    .done(cb);
};
