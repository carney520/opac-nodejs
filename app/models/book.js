var mg = require('mongoose'),
    cacheable = require('./cacheable'),
    Promise = require('bluebird'),
    Schema = mg.Schema;

var bookSchema = new Schema({
  first_category:{type:String,index:true,required:true},
  second_category:{type:String,index:true,required:true},
  //category_no:{type:String,index:true,required:true},  //分类号
  call_no:{type:String,unique:true,required:true},      //索引号
  isbn:{type:String, unique:true,required:true},
  name:{type:String,index:true,required:true},         // 图书名
  summary:{type: String},     //简介
  contents:{type:String},     //目录
  cover:{type: String},
  author:{type:[String],index:true,required:true},
  translator:{type:[String],index:true},
  type:{type: String, required:true},        //图书类型
  language:{type:String},
  page_no:{type:Number},
  publisher:{type:String, index:true,required:true},
  publication_year:{type:Date, index:true,default: Date.now},
  price:String,
  holdings:{type:Number,default:0},           //馆藏
  availables:{type:Number,default:0},         //可借出
  statistics_info:{
    view_count:  {type:Number,default:0},
    borrow_count:{type:Number,default:0},
    mark_count:  {type:Number,default:0},
    reply_count: {type:Number,default:0},
    rate: {type:Number,default:0,min:0,max:5}
  },
  books:[                  //馆藏书籍
     {
       status:{type:String,default:'free',enum:['lent_out','free','reserved']},
       accession_no:{type:String,index:true},    //访问号
       collection_site:[String],      //馆藏位置
     }
   ],
   attachments:{type:String},
   tags:{type:[String],index:true},
   entry_date:{type:Date,default:Date.now},
});


var incr = function(key,dbkey,threshold){
  threshold = threshold || 5;
  return function(bookid,incrValue,initialize){
    var Model = this;
    incrValue = incrValue || 1;
    initialize = initialize || Model.findById(bookid,{statistics_info:1})
      .then(function(book){
        if(book){
          return book.statistics_info[dbkey];
        }
      });

    cacheable.incrWriteBack.call(this,bookid,key,function(value,id,key){
      var updatedoc = {};
          updatedoc['statistics_info.'+dbkey] = value;
      Model.findByIdAndUpdate(id,updatedoc,function(){});
    },initialize,incrValue,threshold)
    .catch(function(err){
      console.log('出错',err);
    });
  };
};

//增加收藏数量,为了避免崩溃后出现数据不一致，阈值设置为1
bookSchema.statics.incrMarkCount = incr('marked','mark_count',1);
//增加浏览数量
bookSchema.statics.incrViewCount = incr('viewed','view_count');
bookSchema.statics.incrBorrowCount = incr('loan','borrow_count');
bookSchema.statics.incrRepliesCount = incr('replied','reply_count',1);


['viewed','marked','loan','replied'].forEach(function(key){
  bookSchema.statics['get'+key.replace(/^./,function(match){return match.toUpperCase();})] = function(id){
    return cacheable.getIncr.call(this,id,key)
      .then(function(value){
        if(value) return value;
      });
  };
});


var Book = mg.model('Book',bookSchema);
module.exports = Book;
