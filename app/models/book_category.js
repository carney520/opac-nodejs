var mg = require('mongoose');
var cacheable = require('./cacheable');
var Schema = mg.Schema;

//二级分类
var bookCategorySchema = new Schema({
  name:{type:String,unique:true,required:true},
  children:{type:[String],index:true}
});

bookCategorySchema.statics.touch = cacheable.cacheTouch;
bookCategorySchema.statics.all = function(){
  return cacheable.all.call(this,null,'name',{_id:0,__v:0});
};


module.exports = mg.model('BookCategory',bookCategorySchema);
