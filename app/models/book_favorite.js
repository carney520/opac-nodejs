var mg = require('mongoose');
var Schema = mg.Schema;

var bookFavoriteSchema = new Schema({
  _id:{type:String,unique:true,require:true},
  user_id:{type:String,index:true,required:true}, //用户的card_no
  book_id:{type:Schema.Types.ObjectId,index:true,required:true},
  name:{type:String,required:true},
  author:{type:[String]},
  tags:{type:[String],required:true,index:true}, //标签集合
  collection_date:{type:Date, default:Date.now},
  notes:{type:String}
});

module.exports = mg.model('BookFavorite',bookFavoriteSchema);
