var models = require('../../models/index'),
    Book = models.Book,
    BookCollectionSite = models.BookCollectionSite,
    _ = require('underscore'),
    mg = require('mongoose');

exports.index = function(req,res,next){};
exports.create = function(req,res,next){
  var bookId = req.params.id;
  collection_params(req,function(err,params){
    var availables = 0;
    if(err) return next(err);
    if(params.accession_no.trim() === ''){
      params.accession_no = new mg.Types.ObjectId();
    }
    if(params.status === 'lent_out'){//检测初始状态
      availables = 0;
    }else{
      availables = 1;
    }
    Book.findByIdAndUpdate(bookId,{$push:{books:params},$inc:{holdings:1,availables:availables}})
      .then(function(product){
        if(product){
          res.redirect(303,req.url_for('intl_book',product.id));
        }else{
          next();
        }
      })
    .catch(function(err){
      next(err);
    });
  });
};

exports.update = function(req,res,next){
  var bookId = req.params.id,
      collection_id = req.params.collection_id;
  collection_params(req,function(err,params){
    if(err) return next(err);
    //首先查找
    Book.findOne({_id:bookId,'books.accession_no':collection_id})
      .select({__v:1,availables:1,books:1})
      .then(function(product){
        if(product){
          var collection = _.find(product.books,function(value){return value.accession_no === collection_id;});
          //状态转变
          // free -> lent_out  => availables--
          // free -> reserved  => availables
          // lent_out -> free  => availables++
          // lent_out -> reserved => availables++
          // reserved -> lent_out => availables--
          // reserved -> free  => availables
          console.log(collection);
          var from = collection.status,
              to = params.status,
              availables = 0;
          if((from === 'free' || from ==='reserved') && to === 'lent_out'){
            availables-=1;
            console.log('借出');
          }else if(from === 'lent_out' && (to === 'free' || to === 'reserved')){
            availables+=1;
            console.log('归还');
          }
          product.availables+=availables;
          _.extend(collection,params);
          return product.save();
        }else{
          next();
        }
      })
    .then(function(product){
      if(product){
        res.format({
          json:function(){
            res.json({code:200,message:'success',bookId:product.id,collectionId:collection_id,status:params.status});
          },
          html:function(){
            res.redirect(req.url_for('intl_book',product.id));
          }
        });
      }
    })
    .catch(function(err){
      next(err);
    });
  });
};

exports.destroy = function(req,res,next){
  var bookId = req.params.id,
      collection_id = req.params.collection_id;
  Book.findByIdAndUpdate(bookId,{$pull:{books:{accession_no:collection_id}},$inc:{holdings:-1,availables:-1}})
    .then(function(product){
      if(product){
        res.json({code:200,message:'deleted',bookId:product.id});
      }else{
        next();
      }
    })
  .catch(function(err){
    next(err);
  });
};

exports.show = function(req,res,next){
  next();
};

exports.new = function(req,res,next){
  var bookId = req.params.id;
  BookCollectionSite.getNames()
    .then(function(collection_sites){
      res.locals.action_path = req.url_for('collections',bookId);
      res.locals.collection_sites = collection_sites;
      res.render('book/new_collection');
    })
  .catch(function(err){
    next(err);
  });
};

exports.edit = function(req,res,next){
  var bookId = req.params.id,
      collection_id = req.params.collection_id;
  Book.findOne({_id:bookId,'books.accession_no':collection_id})
    .select({books:1})
    .then(function(product){
      if(product){
        BookCollectionSite.getNames()
          .then(function(collection_sites){
            var collection = _.find(product.books,function(value){return value.accession_no === collection_id;});
            res.locals.isEdit=req.url_for('collection',bookId,collection_id);
            res.locals.collection_sites = collection_sites;
            res.render('book/new_collection',collection);
          })
        .catch(function(err){
          next(err);
        });
      }else{
        next();
      }
    })
  .catch(function(err){
    next(err);
  });
};


var collection_params = function(req,callback){
  req.filter.require(
      'collection_site',
      'status'
      )
    .permit('accession_no').done(callback);
};
