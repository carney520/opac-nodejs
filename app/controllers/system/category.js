var BookCategory = require('../../models/index').BookCategory;

exports.before = function(req,res,next){
  next();
};

//分类主页,用于修改和增添分类
exports.index = function(req,res,next){
  BookCategory.find()
    .sort('name')
    .then(function(products){
      var uri_template = req.url_template_for('categories');
      res.locals.url_template = uri_template.templates;
      res.locals.url_replacement = uri_template.replacements;
      res.render('category/index',{categories:products});
    })
  .catch(function(err){
  });
};

//创建主分类
exports.create = function(req,res,next){
  category_params(req,function(err,params){
    if(err){
      return next(err);
    }
    new BookCategory(params).save()
      .then(function(product){
        BookCategory.touch();
        res.status(201).json({code:201,message:'created',id:product.id,name:product.name});
      })
    .catch(function(err){
      next(err);
    });
  });
};

//修改主分类
exports.update = function(req,res,next){
  var id = req.params.id;
  category_params(req,function(err,params){
    if(err) return next(err);
    BookCategory.findById(id)
      .then(function(category){
        if(category){
          category.name = params.name;
          category.save()
            .then(function(product){
              //更新成功
              res.json({code:200,message:'updated',id:product.id,name:product.name});
              BookCategory.touch();
            })
          .catch(function(err){
            next(err);
          });
        }else{
          //not found
          next();
        }
      })
    .catch(function(err){
      next(err);
    });
  });
};

//删除主分类
exports.destroy = function(req,res,next){
  var id = req.params.id;
  BookCategory.findByIdAndRemove(id)
    .then(function(product){
      if(product){
        BookCategory.touch();
        res.json({code:200,message:'deleted',id:product.id,name:product.name});
      }else{
        next();
      }
    })
  .catch(function(err){
    next(err);
  });
};

//创建次分类
exports.create_child = function(req,res,next){
  var id = req.params.id;
  category_params(req,function(err,params){
    if(err) return next(err);
    BookCategory.findByIdAndUpdate(id,{$push:{children:params.name}})
      .then(function(product){
        if(product){
          BookCategory.touch();
          //插入成功
          res.json({code:200,message:'inserted',id:product.id,name:params.name});
        }else{
          next();
        }
      })
    .catch(function(err){
      next(err);
    });
  });
};

//删除次分类
exports.destroy_child = function(req,res,next){
  var id = req.params.id,
      child_name = req.params.child_name;

  BookCategory.findByIdAndUpdate(id,{$pull:{children:child_name}})
    .then(function(product){
      if(product){
        BookCategory.touch();
        res.json({code:200,message:'deleted',
          id:product.id, name:product.name,
          child:child_name
        });
      }else{
        next();
      }
    })
  .catch(function(err){
    next(err);
  });
};

var category_params = function(req,cb){
  req.filter.require('name')
    .done(cb);
};
