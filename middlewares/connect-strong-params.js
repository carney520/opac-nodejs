var _ = require('underscore');
var util = require('util');

/*
 * req.param(options).require('name').permit();
 */
var ParameterMissingError = function(key,message){
  this.status = 401;
  this.code = 401;
  this.param = key;
  this.message = message || 'parameter missing: ' + key;
};
util.inherits(ParameterMissingError,Error);

var StrongParams = function(req){
  //合并请求参数
  this._params = _.extend({},req.params,req.body,req.query);
  this.req = req;
  this.parameters = {};
};

/*
 * 设置必须的请求参数
 * req.param.require('name').permit(function(err,params){
 * ...
 * })
 */
StrongParams.prototype.require = function(){
  this._requireds = _.toArray(arguments) || [];
  return this;
};

/*
 * parameters filter:
 *
 * permit('name','age');        //allow 'name' and 'age'
 * permit({'info':{},tags:[]}); //expect info is a object,and tags is an Array
 * permit({'info':['name','age']}); //allow info.name and info.age
 * permit({'info':{'address':['work','family']}}) //allow info.address.work and info.address.family
 */

StrongParams.prototype.permit = function(){
  var args = _.toArray(arguments);
  if(args.length === 0){
    //allow all
    _.extend(this.parameters,this._params);
    return this;
  }
  var that = this;
  _.forEach(args,function(value){
    if(_.isString(value)){
      if(that._params.hasOwnProperty(value))
        that.parameters[value] = that._params[value];
    }else if(_.isObject(value)){
      //nested parameters
      that.hash_filter(value,that._params,that.parameters);
    }else if(_.isFunction(value)){
      return that.done(value);
    }
  });
  return this;
};

/*
 * @param {String} message - optional error message
 * @param {Function} callback 
 */
StrongParams.prototype.done = function(message,callback){
  //check require
  var requires = this._requireds;
  if(_.isFunction(message)){
    callback = message;
    message = undefined;
  }


  try{
    if(!_.isEmpty(requires)){
      for(var i = 0;i < requires.length; i++){
        var value = requires[i];
        if(this._params[value])
          this.parameters[value] = this._params[value];
        else
          throw new ParameterMissingError(value,message);
      }
    }
    callback(null,this.parameters);
  }catch(err){
    callback(err);
  }
};

var hash_filter = function(hash,source,target){
  _.forEach(hash,function(value,key){
    //如果键不存在，则跳过
    if(!source[key]) return;
    //一层嵌套的场景:{name:[],name2:{}}
    if(_.isEmpty(value)){
      if(_.isObject(value) && _.isObject(source[key]) ||
          (_.isArray(value) && _.isArray(source[key])))
        target[key] = source[key];
    }else{
      //嵌套参数,递归
      target[key]=target[key] || {};
      if(_.isArray(value)){
        _.forEach(value,function(item){
          target[key][item] = source[key][item];
        });
      }else{
        hash_filter(value,source[key],target[key]);
      }
    }
  });
};

StrongParams.prototype.hash_filter = hash_filter;

module.exports = function(req,res,next){
  req.filter = new StrongParams(req);
  next();
};
