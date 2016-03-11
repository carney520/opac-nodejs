var models = require('../../models/index'),
    BookType = models.BookType,
    BookCategory = models.BookCategory,
    Book = models.Book,
    Composition = models.Composition,
    multer = require('multer'),
    path = require('path'),
    fs = require('fs'),
    Promise = require('bluebird'),
    Pagination = require('../../../middlewares/pagination'),
    qs = require('qs'),
    _ = require('underscore');

var print = function(title,obj){
  console.log(title,obj);
};

exports.before = function(req,res,next){
  res.locals.action_path = req.url_for('intl_books');
  next();
};

exports.index = function(req,res,next){
  Promise.props({
    book_types: BookType.getNames()
  })
  .then(function(results){
    //图书类型
    if(results.book_types){
      res.locals.bookTypes = results.book_types;
    }

    if(req.user && (req.user.role === 'admin' || req.user.role ==='super'))
      res.render('book/index_in');
    else
      res.render('book/index');
  })
  .catch(function(err){
    next(err);
  });
};

exports.new = function(req,res,next){
  //获取图书类型
  BookType.getNames() 
    .then(function(values){
      res.locals.bookTypes = _.map(values,function(value){
        return {name:value,value:value}; //for select
      });
      //获取图书分类
      BookCategory.all()
        .then(function(categories){
          res.locals.firstCategories = _.pluck(categories,'name');
          res.locals.categories = _.indexBy(categories,'name');
          res.render('book/new',{needUpload:true});
        })
      .catch(function(err){
        next(err);
      });
    }).catch(function(err){
      next(err);
    });
};

//新建图书
exports.create = function(req,res,next){
  book_params(req,function(err,params){
    if(err) return next(err);
    new Book(params).save()
      .then(function(product){
          res.status(201).json({
            code:200,
            message:'created',
            id:product.id,
            name:product.name
          });
        })
    .catch(function(err){
      if(err.name ==='ValidationError'){
        //验证失败
        res.status(400).json({code:400,message:'表单数据格式错误'});
      }else if(err.code === 11000){
        res.status(400).json({code:400,message:'索引号或者ISBN号重复'});
      }else
        next(err);
    });
  });
};

exports.search = function(req,res,next){
  req.filter.permit(
      'field',
      'q',
      'total',
      'name','author','translator','year','type','tags','category','isbn',
      'call_no','language','publisher',
      'start','count','sort_key','sort_order',
      'page'
      )
  .done(function(err,params){
    if(err) return next(err);
    //出去空值
    _.forEach(params,function(value,key){
      if(value.trim() === ''){
        delete params[key];
      }
    });
    //避免空请求
    if(params.hasOwnProperty('field') && !params.q){
      return;
    }
    params.q = params.q || "";
    params.count = params.count || 3;  //每页显示数
    params.sort_key = params.sort_key || 'publication_year';
    params.sort_order = params.sort_order || -1;  //降序
    params.sort={}; //按出版时间降序
    params.sort[params.sort_key]= Number.parseInt(params.sort_order); //按出版时间降序
    params.start = params.start || 0;  //偏移数

    if(params.hasOwnProperty('page')){  //客户端使用page分页机制
      params.start = (params.page - 1) * params.count;
    }
    if(params.field === 'any' && params.q.trim !== '' && params.start === 0){
      //记录检索词
      Composition.addSearchedKey(params.q)
        .then(function(){})
        .catch(function(err){
          console.log('缓存检索词失败',err);
        });
    }


    search(params)
      .then(function(results){
        if(!results) return res.render('book/search');
        console.log(results);
        //用于设置请求字符串
        res.locals.setSearchString = function(field,value,more_key_and_value){
          var key_values = _.partition(_.toArray(arguments),function(n,i){return i%2 ===0;}),
              obj = _.object(key_values[0],key_values[1]),
              currentQueryString = _.clone(req.query),
              reqpath =path.join(req.baseUrl,req.path);
          delete currentQueryString.page; //删除分页信息
          delete currentQueryString.total;
          _.extend(currentQueryString,obj);
          return reqpath + '?' + qs.stringify(currentQueryString);
        };
        //检索词
        res.locals.querywords =  results.expression.join(', ');
        res.locals.search_name = res.locals.querywords;
        //分页
        res.locals.pagination = new Pagination(results.total,results.start,results.expect_count);
        res.render('book/search',results);

      })
    .catch(function(err){
      next(err);
    });
  });
};

exports.update = function(req,res,next){};
exports.edit = function(req,res,next){};

exports.show = function(req,res,next){
  //显示图书
  var id = req.params.id;
  Promise.props({
    viewed:Book.getViewed(id),
    marked:Book.getMarked(id),
    replied:Book.getReplied(id),
    book: Book.findById(id)
  })
  .then(function(product){
    if(product.book){
      var stat = product.statistics_info;
      product.marked = product.marked || (stat && stat.mark_count) || 0;
      product.viewed = product.viewed || (stat && stat.view_count) || 0;
      product.replied = product.replied || (stat && stat.mark_count) || 0;
      Book.incrViewCount(id,1,product.viewed);
      res.render('book/show',product);
    }else{
      next();
    }
  })
  .catch(function(err){
    next(err);
  });
};
exports.destroy = function(req,res,next){};

var search = function(doc){
  var startTime = Date.now(),
      start  = doc.start || 0,
      count  = doc.count || 20,
      sort   = doc.sort  || 'name',
      queryExpression = [];
  if(doc.field && doc.field !== 'any'){
    doc[doc.field] = doc.q;
  }

  var querywordsMap = {   //检索词
    name:'书名(前方一致)',
    author:'作者(前方一致)',
    translator:'译者(前方一致)',
    isbn: 'ISBN',
    tags: '标签',
    publisher:'出版社(前方一致)',
    call_no:'索引号',
    any:'任意词',
    category:'分类',
    year:'出版年',
    type:'图书类型',
    language:'语言'
  };

  if(doc.field === 'any'){
    queryExpression.push(querywordsMap.any + '="'+ doc.q+'"');
  }
  for(var queryKey in doc){
    if(querywordsMap.hasOwnProperty(queryKey)){
      queryExpression.push(querywordsMap[queryKey] + '="' + doc[queryKey] +'"');
    }
  }
  //处理doc
  var findDoc ={};
  if(doc.hasOwnProperty('call_no')){
    //精确匹配
    findDoc.call_no = doc.call_no;
  }
  if(doc.hasOwnProperty('isbn')){
    //精确匹配
    findDoc.isbn = doc.isbn;
  }
  if(doc.hasOwnProperty('name')){
    //前方一致: 这样可以利用索引
    findDoc.name = new RegExp('^'+ doc.name,'i');
  }
  if(doc.hasOwnProperty('author')){
    //与前方一致
    findDoc.author = new RegExp('^'+doc.author,'i');
  }
  if(doc.hasOwnProperty('translator')){
    findDoc.translator = new RegExp('^'+doc.translator,'i');
  }
  if(doc.hasOwnProperty('publisher')){
    //与前方一致
    findDoc.publisher = new RegExp('^'+doc.publisher,'i');
  }
  if(doc.hasOwnProperty('category')){
    findDoc.$or = [
      {first_category:doc.category},
      {second_category:doc.category}
    ];
  }
  if(doc.hasOwnProperty('tags')){
    //与前方一致，不区分大小写
    var tags = doc.tags.split(' ').map(function(value){
      return new RegExp('^'+value,'i');
    });
    findDoc.tags = {$all:tags};
  }

  if(doc.hasOwnProperty('year')){
    //获取一年范围
    var year = new Date(doc.year),
        next = new Date(doc.year);
    next.setFullYear(Number.parseInt(doc.year)+1);
    findDoc.publication_year = {$gte:year,$lt: next};
  }

  if(doc.hasOwnProperty('type')){
    findDoc.type = doc.type;
  }
  if(doc.hasOwnProperty('language')){
    findDoc.language = doc.language;
  }

  //如果请求为空则返回null；
  if(_.isEmpty(findDoc) && !doc.field){
    Promise.resolve(null);
  }

  var querydoc =null;
  if(doc.field === 'any'){ //模糊搜索
    var q = doc.q;
    querydoc = {$or:[
      {name: new RegExp(q,'i')},
      {author: new RegExp(q,'i')},
      {tags:new RegExp('^'+q,'i')},
      {publisher:new RegExp(q,'i')}
    ]};

    ['name','author','tags','publisher'].forEach(function(key){
      if(findDoc.hasOwnProperty(key)) delete querydoc.$or[key];
    });
    
    if(querydoc.$or.length === 0) delete querydoc.$or;

    if(querydoc.$or && findDoc.hasOwnProperty('$or')){ 
      //合并category
      querydoc = {$and: [querydoc,{$or:findDoc.$or}]};
      delete findDoc.$or;
    }
    querydoc = _.extend(findDoc,querydoc);
  }else{
    querydoc = findDoc;
  }
  //TODO 排序
  print('检索对象:',querydoc);

  var props = {
    results:  //结果集
      Book.find(querydoc)
        .select({ //剔除字段
          contents:0,
          books:0,
          statistics_info:0,
          summary:0,
          __v:0
        })
        .skip(start)
        .limit(count)
        .sort(sort),
    /*缩检*/
      tags:        //结果集包含的标签
        Book.distinct('tags',querydoc),
      categories:  //分类
        Book.aggregate()
        .match(querydoc)
        .project({second_category:1})
        .group({_id:'$second_category',count:{$sum:1}}).exec(),
      types:      //图书类型
        Book.aggregate()
        .match(querydoc)
        .project({type:1})
        .group({_id:'$type',count:{$sum:1}}).exec(),
      years:     //出版年
        Book.aggregate()
        .match(querydoc)
        .project({year:{$year:'$publication_year'}})
        .group({_id:'$year',count:{$sum:1}}).exec()
  };
 
  if(!doc.hasOwnProperty('total')){
    //一些请求无须重复求总数
    props.total = Book.find(querydoc).count();
  }else{
    props.total = doc.total;
  }

  return new Promise.props(props)
    .then(function(results){
      results.times = Date.now() - startTime; //统计时间 ms
      results.start = start; //偏移
      results.actual_count = results.results.length;
      results.expect_count = count;
      results.sort = sort;
      results.expression = queryExpression;
      return results;
    });
};

var htmlEscape = function(content){
  content = content.replace(/</g,'&lt;');
  content = content.replace(/>/g,'&gt;');
  content = content.replace(/\n/g,'<br/>');
  return content;
};

var book_params = function(req,callback){
  req.filter.require(
      'name',  //书名
      'author',
      'publisher',
      'isbn',
      'type',
      'language',
      'first_category',
      'call_no'
      )
    .permit(
        'translator',
        'page_no',
        'publication_year',
        'price',
        'summary',
        'contents',
        'second_category',
        'cover_url',
        'tags'
        )
    .done(function(err,params){
      if(err) return callback(err);
      params.author = params.author && params.author.split(',');
      params.translator = params.translator && params.translator.split(',');
      params.tags = params.tags && params.tags.split(',');
      params.cover = params.cover_url;
      //转义textarea中的换行
      params.contents = htmlEscape(params.contents);

      //处理上传文件
      var coverFile = _.where(req.files,{fieldname:'cover-file'}).pop();
      if(coverFile){
        var final_path = path.join('public/images/covers',params.call_no),
            old_path = coverFile.path;
        return fs.rename(old_path,final_path,function(err){
          if(err) return callback(err);

          params.cover = path.join('images/covers',params.call_no);
          callback(null,params);
        });
      }
      callback(null,params);
    });
};
