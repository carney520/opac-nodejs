var models = require('../../models/index'),
    Composition = models.Composition,
    _ = require('underscore'),
    Promise = require('bluebird');

/*
 * 复合资源:
 *    热门检索词
 *    热门收藏
 *    热门借阅
 *    热门评论
 *    新书
 */

exports.index = function(req,res,next){
  Promise.props({
    week:Composition.getMostSearched('week'),
    month:Composition.getMostSearched('month'),
    most_favored: Composition.getMostFavored(),
    most_hot: Composition.getMostHot()
  })
  .then(function(results){
    _.forEach(results,function(value,key){
      if(_.includes(['week','month'],key))
        return;
      results[key] = _.head(value,20);
    });
    res.render('index',results);
  })
  .catch(function(err){
    next(err);
  });
};
