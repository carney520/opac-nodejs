var mg = require('mongoose');
var  _ = require('underscore');
var cache = require('./cache');
var cacheable = require('./cacheable');
var Schema = mg.Schema;
var Promise = require('es6-promise').Promise;

//book type 规定不同的图书类型的一些借阅规则
var bookTypeSchema = new Schema({
  name:{type: String,unique: true, required:true},
  max_number_loan:{type:Number,required:true},
  max_days_loan: {type:Number,required:true},
  max_times_renewals:{type:Number, require:true},
  max_days_renewals:{type:Number,required:true},
  reservation_threshold:{type:Number,require:true},
  reservation_expire:{type:Number,required:true},
  created_at:{type:Date,default:Date.now}
});

bookTypeSchema.statics.getNames = function(){
  return cacheable.fieldList.call(this,'name');
};

bookTypeSchema.statics.all = cacheable.all;

bookTypeSchema.statics.getById = cacheable.getById;
bookTypeSchema.statics.getByName = cacheable.getByName;

bookTypeSchema.statics.removeById = cacheable.removeById;

bookTypeSchema.statics.create = cacheable.create;
bookTypeSchema.statics.updateById = cacheable.updateById;

module.exports = mg.model('BookType',bookTypeSchema);
