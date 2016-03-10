var Promise = require('bluebird'),
    cache = require('./cache'),
    client = cache.client,
    BookFavorite = require('./book_favorite'),
    Book = require('./book'),
    _ = require('underscore'),
    cacheable = require('./cacheable');
var one_day = 60*60*24,
    one_week = one_day *7,
    one_month = one_week *4,
    one_hour = 60*60,
    one_minute = 60;

var scoreToObject = function(arr){
  arr = _.partition(arr,function(v,k){return k % 2 === 0;});
  return _.object(arr[0],arr[1]);
};
/* 热搜 */
exports.getMostSearched = function(time,start,end){
  var prefix = 'mostSearched:',
      week = prefix+'week',
      month = prefix+'month',
      weekLastCreated = week + '.lastCreated',
      monthLastCreated = month + '.lastCreated';
  start = start || 0;
  end = end || 20;
  switch(time){
    case 'week':
      return client.zrevrange(week,start,end,'WITHSCORES')
        .then(function(result){
          if(result) return scoreToObject(result);
        });
    case 'month':
      return client.zrevrange(month,start,end,'WITHSCORES')
        .then(function(result){
          if(result) return scoreToObject(result);
        });
  }
};

exports.addSearchedKey = function(key){
  var prefix = 'mostSearched:',
      week = prefix+'week',
      month = prefix+'month',
      weekLastCreated = week + '.lastCreated',
      monthLastCreated = month + '.lastCreated';


  Promise.props({
    week: client.get(weekLastCreated),
    month: client.get(monthLastCreated)
  })
  .then(function(results){
    var interval;
    if(results.week){
      //计算是否过期
      interval = Date.now() - Number.parseInt(results.week);
      if(interval >= 1000*one_week){
        //过期
        client.del(week);
        client.set(weekLastCreated,Date.now());
      }
    }else{
      client.set(weekLastCreated,Date.now());
    }

    if(results.month){
      interval = Date.now() - Number.parseInt(results.month);
      if(interval >= 1000*one_month){
        client.del(month);
        client.set(monthLastCreated,Date.now());
      }
    }else{
      client.set(monthLastCreated,Date.now());
    }
  })
  .catch(function(err){
    console.log(err);
  });

  var pipeline = client.pipeline();
  pipeline.zincrby(week,1,key);
  pipeline.zincrby(month,1,key);
  return pipeline.exec();
};


exports.getMostFavored = function(){
  //检索收藏最多的书本
  var key = 'mostFavored';
  return new Promise(function(resolve,reject){
    cache.isExist(key)
      .then(function(value){
        if(value === 1){
          //存在缓存
          cache.get(key,function(err,data){
            if(err) return reject(err);
            resolve(data);
          });
        }else{
          //缓存数据
          BookFavorite.aggregate()
            .project({book_id:1,name:1})
            .group({_id:'$book_id',
              name:{$first:'$name'},
              count:{$sum:1}
            })
            .sort({count:-1})
            .limit(100)
            .exec()
            .then(function(items){
              cache.set(key,items,one_day);
              resolve(items);
            })
            .catch(function(err){
              reject(err);
            });
        }
      })
    .catch(function(err){
      reject(err);
    });
  });
};


exports.getMostHot = function(){
  var key = 'mostHot';
  return new Promise(function(resolve,reject){
    cache.isExist(key)
    .then(function(value){
      if(value === 1){
        //从缓存中获取结果
        cache.get(key,function(err,data){
          if(err) return reject(err);
          resolve(data);
        });
      }else{
        //从mg中获取并缓存
        Book.find()
          .select({name:1,statistics_info:1})
          .sort({'statistics_info.reply_count':-1})
          .limit(100)
          .then(function(books){
            cache.set(key,books,one_day);
            resolve(books);
          })
        .catch(function(err){
          reject(err);
        });
      }
    })
    .catch(function(err){
      reject(err);
    });
  });
};
