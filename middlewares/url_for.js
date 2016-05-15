/* 
 * resources_register:
 * 该模块用猴补丁方式给express Application对象添加一个register方法
 * 用于注册一个Router对象，相当于app.use(path.join(prefix,resource_name),router),返回一个Router的代理对象
 *
 * var admins = app.register('/prefix','admins')
 * admins.use(adminControler.before);
 * admins.route('/')
 *   .get(adminController.index)
 *   .post(adminController.create);
 *
 * 另外它还提供了一个url_for模板帮助方法:
 * //- jade
 * a(href=url_for('admins'))  //-<a href='/prefix/admins'>
 * a(href=url_for('admin_new'))  //-<a href='/prefix/admins/new'>
 * a(href=url_for('admin_edit',id))  //-<a href='/prefix/admins/{id}/edit'>
 * a(href=url_for('admin_posts',id))  //-<a href='/prefix/admins/id/posts'>
 * a(href=url_for('admin_post',admin_id,post_id))  //-<a href='/prefix/admins/{admin_id}/posts/post_id'>;
 * ## 注意要严格遵循RESTful风格的单复数
 *
 */

var paths = require('path').posix,
    pluralize = require('pluralize'),
    express = require('express'),
    _ = require('underscore'),
    methods = require('methods'),
    qs = require('qs'),
    Router = express.Router,
    app = express.application,
    req = express.request;

//save path alias
var resources_paths = {
  __resources:{}
};


//make a url
var make_url = function(options){
  var user = options.user || '',
      password = options.password || '',
      auth = '',
      url = '',
      qs_opts = options.qs || {};

  if(user && password){
    auth = user + ':' + password + '@';
  }


  var protocol = options.protocol || '',
      path = options.path || '',
      anchor = options.anchor || '',
      query = options.query || null,
      host = options.host || '',
      port = options.port || '';


  if(host){
    if(port) host = host +':' + port;
    if(protocol)
      url = protocol + '://';
    else
      url = 'http://';
    url += auth + host;
  }

  //path
  if(path){
    if(path[0] !== '/')
      path = '/' + path;
    url +=path;
  }
  //query string
  var queryString = qs.stringify(query,qs_opts);
  if(queryString)
    url += '?' + queryString;

  //anchor
  if(anchor){
    url += '#' + anchor;
  }
  return url;
};


/*
 * TODO
 * button_to
 * link_to
 * is_current_page
 * form_for
 * debug
 *
 */




/*
 * 创建一个路由路径，通过传入路由别名返回一个绝对路径
 * options: TODO
 * @param {String} - path_alias 路径别名
 * @param {Object} - options 路径选项
 */
var url_for = function(path_alias,options){
  var args = _.toArray(arguments),
      resource = resources_paths[args.shift()],
      ids = [],  //填充URI模板的变量
      absolute_path,  //用于返回的绝对路径
      i,
      req = this,    //express request对象
      only_path = true;  //只返回URI路径

  //获取填充变量
  while(args.length > 0){
    var _cur = args.shift();
    if(_.isObject(_cur) && _cur.constructor === Object) options = _cur;
    else ids.push(_cur);
  }

  //default options
  var default_options = {
    anchor:'',
    only_path:true,
    host:req.hostname,
    port:req.app.get('port') || process.env.PORT,
    protocol:req.protocol,
    user:'',
    password:''
  };

  if(options && options.only_path !== undefined)
    only_path = options.only_path;
  else if (options && (options.query || options.host || options.port || options.protocol || (options.user && options.password)))
    only_path = false;

  options = _.extend(default_options,options);


  if(resource){
    //check arguments
    if(ids.length === resource.required_params){
      absolute_path = resource.path;
      //替换路由参数
      for(i = 0; i < ids.length; i++){
        absolute_path = absolute_path.replace(resource.router_variables[i],ids[i].toString());
      }
      /*构造url */
      if(only_path)
        return absolute_path;
      else{
        options.path = absolute_path;
        return make_url(options);
      }
    }else{
      throw new Error("Required parameter missing: expect " + resource.router_variables.join(', '));
    }
  }else if(path_alias === 'back'){
    var referer =req.get('Referer');
    if(referer)
      return referer;
    else return "javascript:history.back()";
  }
  else{
    throw new Error("unknow path alias: " + path_alias);
  }
};

var uri_template = function(resource_name,rest){
  var args = _.toArray(arguments);
  return  _.reduce(
    _.map(args,function(resource_name){
      if(!resources_paths.__resources.hasOwnProperty(resource_name)){
        throw new Error('Unkown resource name:' + resource_name);
      }else{
        var path_alias = resources_paths.__resources[resource_name],
            templates = {},
            replacements ={};
        path_alias.forEach(function(alias){
          var _cur = resources_paths[alias];
          templates[alias] = _cur.path;
          replacements[alias] = _cur.router_variables;
        });
        return {
          templates:templates,
          replacements:replacements
        };
      }
    }),
      function(memo,obj){
        return {
          templates:_.extend(memo.templates,obj.templates),
          replacements:_.extend(memo.replacements,obj.replacements)
        };
      }
  );
};

/*
 * @return {Object} Router
 */

var RouterAgent = function(router,prefix,resource_name,no_append_resource_name){
  this._router = router;
  this._prefix = prefix;
  this._resource_name = resource_name;
  if(no_append_resource_name){
    this._path_prefix = prefix;
  }else{
    this._path_prefix = paths.join(prefix,resource_name);
  }
};

var includesPatterns = function(path){
  var patterns =['*','?','+','(',')'];
  for(var i = 0;i < patterns.length;i++){
    if(path.includes(patterns[i]))
      return true;
  }
  return false;
};

//生成路由别名
RouterAgent.prototype.create_alias = function(path){
  var variables = _.reject(path.split('/'),function(value){ return value ==='';}),
      alias = [variables[0]],
      prev;
  for(var i = 1;i < variables.length; i++){
    prev = alias.pop();
    //当前变量是路由变量
    if(variables[i][0] === ':' && prev !== ':'){
      //单数
      alias.push(pluralize(prev,1));
      alias.push(':');
    }else{
      if(prev !== ':'){
        alias.push(pluralize(prev,1));
      }
      alias.push(variables[i]);
    }
  }
  if(alias[alias.length-1] === ':') alias.pop();
  return alias.join('_');
};

RouterAgent.prototype._compile_path = function(path,as){
  //跳过正则表达式或者通配符路径，因为它们没有具体的路径
  if(_.isRegExp(path) || includesPatterns(path)) 
    return false;
  //路由别名
  url_alias = as || this.create_alias(paths.join(this._resource_name,path));
  if(resources_paths.hasOwnProperty(url_alias)){
    //已存在，跳过
    return false;
  }

  //确定是否包含路由变量
  var router_variables = [],
      variables,
      i,
      url_alias;   //路径别名

  //分析路由变量
  if(path.includes(':')){
    variables = path.split('/');
    for(i = 0; i< variables.length; i++){
      if(variables[i][0] === ':'){ 
        router_variables.push(variables[i]);
      }
    }
  }

  resources_paths[url_alias] = {
    required_params: router_variables.length,//所需的填充变量
    path: paths.join(this._path_prefix,path),//路由路径
    router_variables:router_variables,       //填充变量替换字符
    resource:this._resource_name,            //指向对应的资源名
  };
  
  resources_paths.__resources[this._resource_name].push(url_alias);

  return true;
};

methods.concat(['del','all']).forEach(function(method){
  RouterAgent.prototype[method] = function(path,as){
    var customize_alias;
    if(!_.isFunction(as))
      customize_alias = as;
    this._compile_path(path,customize_alias);
    var args = _.toArray(arguments);
    if(customize_alias){ //剔除
      args = [path].concat(_.rest(args,2));
    }
    this._router[method].apply(this._router,args);
  };
});

RouterAgent.prototype.route = function(path,as){
  var that = this;
  var _methods = {};
  var args = as ? [path,as] : [path];
  methods.concat(['del','all']).forEach(function(method){
    _methods[method] = function(){
      that[method].apply(that,args.concat(_.toArray(arguments)));
      return _methods;
    };
  });
  return _methods;
};

RouterAgent.prototype.use = function(){
  return this._router.use.apply(this._router,arguments);
};

RouterAgent.prototype.param = function(){
  return this._router.param.apply(this._router,arguments);
};

RouterAgent.prototype.p = resources_paths;

/*
 *
 * @param {String} prefix - 路径前缀
 * @param {String} resource_name - 资源名
 * @param {Boolean} no_append_resource_name -是否将资源名加入请求路径,默认为falsek
 * @return {RouterAgent} - Router对象的代理
 */

app.register = function(prefix,resource_name,no_append_resource_name){
  this.locals.uri_template_for = uri_template;
  this.locals.url_template_for = uri_template; //alias
  
  var router = Router(),
      resources_path;

  if(no_append_resource_name){
    resources_path = prefix;
  }else{
    resources_path = paths.join(prefix,resource_name);
  }

  //注册Router对象
  this.use(resources_path,router);

  //为资源创建一个对象，用以保存路由别名
  resource_name = resource_name.replace(/\//g,'');
  resources_paths.__resources[resource_name] = [];
  return new RouterAgent(router,prefix,resource_name,no_append_resource_name);
};

req.url_for  = url_for;

//注册uritemplate
req.uri_template_for = uri_template;
req.url_template_for = uri_template;

module.exports = function(req,res,next){
  var bound_url_for = function(){
    return url_for.apply(req,arguments);
  };
  req.url_for = bound_url_for;
  res.locals.url_for = bound_url_for;
  next();
};
