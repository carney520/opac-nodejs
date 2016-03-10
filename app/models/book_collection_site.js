var mg = require('mongoose');
var cacheable = require('./cacheable');
var Schema = mg.Schema;

//馆藏位置
var BookCollectionSiteSchema = new Schema({
  name:{type:String,unique:true,required:true},
  address:{type:String,required:true},
  phone:{type:String},
  admin:{type:String}
});

BookCollectionSiteSchema.statics.getNames = function(){
  return cacheable.fieldList.call(this,'name');
};

BookCollectionSiteSchema.statics.touch = function(){
  return cacheable.cacheTouch.call(this);
};

module.exports = mg.model('BookCollectionSite',BookCollectionSiteSchema);
