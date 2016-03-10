var BookCollectionSite = require('../../models/index').BookCollectionSite;

exports.before = function(req,res,next){
  res.locals.action_path = req.url_for('collection_sites');
  next();
};

exports.index = function(req,res,next){
  BookCollectionSite.find()
    .sort({name:1})
    .exec()
    .then(function(sites){
      res.render('collection_site/index',{sites:sites});
    })
  .catch(function(err){
    next(err);
  });
};
exports.new = function(req,res,next){
  res.render('collection_site/new');
};

exports.edit = function(req,res,next){
  var id = req.params.id;
  BookCollectionSite.findById(id)
    .then(function(product){
      if(product){
        res.locals.isEdit = req.url_for('collection_site',id);
        res.render('collection_site/new',product);
      }else{
        next();
      }
    })
  .catch(function(err){
    next(err);
  });
};

exports.create = function(req,res,next){
  collection_site_params(req,function(err,params){
    if(err){
      err.render = 'collection_site/new';
      err.locals = req.body;
      err.flash = '必须填入名字和地址';
      return next(err);
    }
    new BookCollectionSite(params).save()
      .then(function(product){
        BookCollectionSite.touch();
        res.format({
          json:function(){
            res.status(201).json({
              code:201,
              message:'create',
              id:product.id
            });
          },
          html:function(){
            req.flash('success','已创建'+product.name);
            res.redirect(303,req.url_for('collection_sites'));
          }
        });
      })
    .catch(function(err){
      err.render = 'collection_site/name';
      err.locals = req.body;
      err.flash = err.message;
      next(err);
    });
  });
};
exports.update = function(req,res,next){
  var id = req.params.id;
  collection_site_params(req,function(err,params){
    if(err){
      res.locals.isEdit = req.url_for('collection_site',id);
      err.render = 'collection_site/new';
      err.locals = req.body;
      err.flash = "必须填入馆藏位置和地址";
      return next(err);
    }
    BookCollectionSite.findByIdAndUpdate(id,params)
      .then(function(product){
        if(product){
          BookCollectionSite.touch();
          res.format({
            json:function(){
              res.json({code:200,message:'updated',id:product.id});
            },
            html:function(){
              req.flash('success','修改成功');
              res.redirect(req.url_for('collection_sites'));
            }
          });
        }else{
          next();
        }
      })
    .catch(function(err){
      res.locals.isEdit = req.url_for('collection_site',id);
      err.flash = err.message;
      err.render = 'collection_site/new';
      err.locals = params;
      next(err);
    });
  });
};

exports.show = function(req,res,next){
  var id = req.params.id;
  BookCollectionSite.findById(id)
    .then(function(product){
      if(product){
        res.render('collection_site/show',{collection_site:product});
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
  BookCollectionSite.findByIdAndRemove(id)
    .then(function(product){
      if(product){
        BookCollectionSite.touch();
        res.format({
          json:function(){
            res.json({code:200,message:'deleted',id:id,name:product.name});
          },
          html:function(){
            req.flash('success','已删除');
            res.redirect(303,req.url_for('collection_sites'));
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

var collection_site_params = function(req,cb){
  req.filter.require('name','address')
    .permit('phone','admin')
    .done(cb);
};
