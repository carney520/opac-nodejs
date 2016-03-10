var _ = require('underscore');

module.exports = function(app){
  var locals = app.locals;
  var getTimeval = function(time){
    if(arguments.length !== 1){
      throw TypeError('expect one argument(time)');
    }
    if(_.isString(time)){
      time = Date.parse(time);
    }else if(_.isDate(time)){
      time = time.getTime();
    }else if(_.isNumber(time)){
      time = time;
    }else{
      throw TypeError('Unkown Time Type');
    }

    var now = Date.now(),
        year = " 年前",
        day = " 天前",
        hour = " 小时前",
        minute = " 分钟前",
        second = "刚刚",
        timeval = (now - time) / 1000;

    if(timeval < 60){
      return second;
    }else if((timeval / 60) < 60){
      return Math.round(timeval/60) + minute;
    }else if((timeval/(60*60)) < 24){
      return Math.round(timeval/(60*60)) + hour;
    }else if((timeval/(60*60*24)) < 365){
      return Math.round(timeval/(60*60*24)) + day;
    }else{
      return Math.round(timeval/(60*60*24*365)) + year;
    }
  };
  locals.getTimeval = getTimeval;
};
