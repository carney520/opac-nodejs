var mg = require('mongoose'),
    Book = require('./book'),
    cacheable = require('./cacheable'),
    Schema = mg.Schema;

var bookCommentSchema = new Schema({
  book_id:{type:Schema.Types.ObjectId,index:true,required:true},
  book_name:{type:String,required:true},
  comment_id:{type:Number,index:true,require:true},  //评论楼数
  deleted: {type:Boolean,default:false},
  reply_id:{type:Number},  //回复的楼数
  user:{
    id:{type:String},
    name:{type:String},
    avatar:String
  },
  reply_user:{
    id:{type:String},
    name:{type:String}
  },
  ups:[String],                    //赞过的用户
  content:{type:String},
  rank:{type:Number,default:0,min:0,max:5},        //评分
  created_on:{type:Date,default:Date.now}
});

bookCommentSchema.statics.getRepliesNumber = function(book_id){
  var Model = this;
  return Book.getReplied(book_id)
    .then(function(value){
      if(value)
        return value;
      else{
        return Model.find({book_id:book_id}).count();
      }
    });
};


//统计评分算法
bookCommentSchema.statics.incrScoringCount = function(bookid){
  //到达某个阈值(10)开始计算图书评分
  var Model = this;
  cacheable.incrWriteBack.call(Model,bookid,'scored',function(value,bookid,key){
    Model.find({book_id:bookid,rank:{$gt:0},deleted:false})
      .select({rank:1,ups:1})
      .then(function(comments){
        if(comments){
          var total = 0,
              length = 0;
          comments.forEach(function(item){
            var likes = item.ups.length,
                 weight = likes ? likes +1 : 1;
            total += item.rank * weight;
            length += weight;
          });
          rank = Math.round(total / length);
          Book.findByIdAndUpdate(bookid,{'statistics_info.rate':rank},function(err){
            if(err) console.log(err);
          });
        }
      })
    .catch(function(err){
      console.log(err);
    });
  },5,1,5);
};

module.exports = mg.model('BookComment',bookCommentSchema);
