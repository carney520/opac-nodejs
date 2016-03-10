$(document).ready(function(){
/* 添加标签功能 */
  
  var $tags = $('input[name="tags"]').val(''),       //提交tags的表单顺便清空
      $tagsContainer = $('.tags-container'); //tag 的显示容器
  //清空tags
  var emptyTags = function(){
    $tags.val('');
    $tagsContainer.empty();
  };

  //从表单标签中删除指定标签
  var removeTag = function(tag){
    var values = $tags.val().split(',');
    $tags.val(_.without(values,tag).join(','));
  };

  //添加标签到表单字段
  var addTag = function(tag){
    tag = tag.trim();
    if(tag === '') return false;
    //添加进表单
    var values = $tags.val();
    if(values === ''){
      $tags.val(tag);
    }else{
      $tags.val(values+','+tag);
    }
    //添加进tags容器
    $tagsContainer.append($('<span>'+tag+'</span>').addClass('tag-item'));
  };

  

  $tagsContainer.on('dblclick','.tag-item',function(event){
    var $target = $(this);
    removeTag($target.html());
    $target.remove();
    return false;
  });

  $('#add-tag').click(function(event){
    var $inputer = $('#tag-inputer');
    var tag = $inputer.val();
    addTag(tag);
    $inputer.val('');
    return false;
  });

/*豆瓣搜索功能 */

  //离线禁用豆瓣搜索
  $(window).on('offline',function(){
    $('#douban-search').attr('disabled','disabled');
  });

  $(window).on('online',function(){
    $('#douban-search').removeAttr('disabled');
  });

  //搜索按钮
  var lastQuery = null;
  $('#douban-search').click(function(event){
    if(lastQuery)
      lastQuery.abort();
    var $content = $('#douban-search-content');
    var value = $content.val();
    if(value === '') return false;
    //新查询，先清空列表
    $('#douban-items').html('');
    $('#douban-total').html(waiting());
    lastQuery = searchDouban(value);
    //request douban
    return false;
  });

  //下一页按钮
  var _last_next_page_query = null;
  var nextPageHandler = function(event){
    //避免重复提交
    if(_last_next_page_query && _last_next_page_query.readyState !== 4){
      return false;
    }
    var $resultsContainer = $('#douban-items'),
        $this = $(this),
        q = $resultsContainer.data('q'),
        lastStart = $resultsContainer.data('start'),
        count = $resultsContainer.data('count'),
        offset = lastStart + count;
    $this.html(waiting());
    _last_next_page_query = searchDouban(q,offset);
    return false;
  };

  //将图书信息添加到表单中
  var itemClickHandler = function(event){
    var $this = $(this),
        bookData = JSON.parse($this.data('content'));

    //inputs
    var $title = $('input[name="name"]'),
        $author = $('input[name="author"]'),
        $translator = $('input[name="translator"]'),
        $publisher = $('input[name="publisher"]'),
        $isbn = $('input[name="isbn"]'),
        $pageNo = $('input[name="page_no"]'),
        $pubDate = $('input[name="publication_year"]'),
        $price = $('input[name="price"]'),
        $summary = $('input[name="summary"]'),
        $contents = $('#contents');

    $title.val(bookData.title);
    $author.val(bookData.author.join(','));
    $translator.val(bookData.translator.join(','));
    $publisher.val(bookData.publisher);
    $isbn.val(bookData.isbn13);
    $pageNo.val(bookData.pages);
    $pubDate.val(bookData.pubdate);
    $price.val(bookData.price);
    $summary.val(bookData.summary);
    $contents.val(bookData.catalog);

    //导入标签
    //先清空标签
    emptyTags();
    bookData.tags.forEach(function(tag){
      addTag(tag.name);
    });

    //封面
    var $cover = $('<img>').attr('src',bookData.image)
      .addClass('book-cover');
    var $coverUrl = $('input[name="cover_url"]')
      .val(bookData.image);
    $('#cover-here').html($cover);
    //$('#cover-file').parent().remove();

    //提示输入欠缺部分
    var recovery = function(){
      $(this).parent().removeClass('has-warning');
    };

    $('#type').change(recovery).parent().addClass('has-warning');
    $('#language').change(recovery).parent().addClass('has-warning');
    $('#first_category').change(recovery).parent().addClass('has-warning');
    $('#second_category').change(recovery).parent().addClass('has-warning');
    $('#call_no').change(recovery).parent().addClass('has-warning');
    return false;
  };

  var searchDouban = function(q,offset,count){
    var $total = $('#douban-total');
    offset = offset || 0;
    count = count || 10;

      //request douban
      return $.ajax('http://api.douban.com/v2/book/search',{
          method:'GET',
          dataType:'jsonp',
          data:{
            q:q,
            start:offset,
            count:count
          }
      })
      .done(function(results){
        var total = results.total,
            start = results.start,
            count = results.count,
            items = results.books,
            $resultsContainer = $('#douban-items');

        //保存当前检索状态，为下一页做准备
        $resultsContainer.data('q',q);
        $resultsContainer.data('start',start);
        $resultsContainer.data('count',count);

        //删除下一页按钮
        $('#douban-nextpage').remove();

        //是否是第一次查询
        if(start === 0){
          $total.html('搜索到 ' + total + ' 册图书');
        }

        items.forEach(function(item){
          //容器
          var $itemContainer = $('<div></div>')
            .addClass('douban-results-item')
            .addClass('list-group-item');
          //封面
          var $cover = $('<img src="'+item.image + '"></img>')
            .addClass('item-cover');
          //标题
          var $header = $('<h4>' + item.title + '</h4>')
            .addClass('list-group-item-heading');
          //内容
          var $content = $('<p>isbn: ' + item.isbn13 + '<br>' +
              '作者: ' + item.author.join(',') + '<br>' +
              '出版社: ' + item.publisher + '<br>' +
              '出版时间: ' + item.pubdate + '<br></p>'
              ).addClass('list-group-item-text');
          //存储内容
          $itemContainer.data('content',JSON.stringify(item));
          $itemContainer.append($cover).append($header).append($content);
          $itemContainer.click(itemClickHandler);
          $resultsContainer.append($itemContainer);
          //绑定点击事件
        });
        
        //检查是否有下一页
        if((start + count) < total ){
          var $nextPage = $('<a id="douban-nextpage" href="#">下一页</a>');
          $nextPage.click(nextPageHandler);
          $resultsContainer.append($nextPage);
        }

      })
      .fail(function(jqxhr,code,err){
        $total.html('请求失败:'+code);
      });
  };

  /* 分类*/
  var $firstCategory = $('#first_category'),
      $secondCategory = $('#second_category'),
      categories = $firstCategory.data('categories'); //data 会自动编译JSON

  $firstCategory.change(function(event){
    var $this = $(this),
        value = $this.val(),
        children = categories[value].children,
        $option = $('<option>');

    $secondCategory.empty();
    children.forEach(function(value){
      var option = $option.clone()
        .val(value)
        .html(value)
        .appendTo($secondCategory);
    });
    $secondCategory.trigger('change');
  });

  $firstCategory.trigger('change');
  
  /* 表单验证*/
  $('#main-form').submit(function(event){
    //清理错误信息
    $('.help-block').remove();
    $('.has-error').removeClass('has-error');

    //check publication_year
    var $publicationYear = $('#publication_year');
    if(! /^\d{4}[-.]\d{1,2}[-.]\d{1,2}/.test($publicationYear.val())){
      $publicationYear.parent().addClass('has-error')
        .append(
            $('<span id="year_help">')
            .addClass('help-block')
            .html('日期格式有误'));
      return false;
    }
    $(this).submit();
  });


  /* 图书搜索*/

  /* 图书显示页面*/
  jQuery.fn.extend({
    window:function(cmd){
      if(cmd === 'show'){
        return this.removeClass('window-hidden').trigger('window.show');
      }else{
        return this.addClass('window-hidden').trigger('window.hide');
      }
    }
  });

  $('#window-cancel').click(function(){
    $('#window').window('hide').trigger('window.hide.cancel');
  });

  var showWindow = function(content,callback,context){
    var $window = $('#window'),
        $windowContent = $('#window .window-content');
        $windowConfirm = $('#window #window-confirm');
        $windowMessage = $('#window .window-message');

    $windowMessage.html('');
    if(typeof content === "string"){
      //显示提示消息
      content = $('<div></div>').addClass('window-info').html(content);
    }
    $windowContent.html(content);
    $windowConfirm.on('click.window',function(event){
      var rtn = callback.apply(context,arguments);
      if(rtn){
        $windowMessage.html(rtn);
      }else{
        $window.window('hide');
      }
    });

    $window.on('window.hide',function(){
      $windowConfirm.off('click.window');
      $windowContent.html('');
    });
    $window.window('show');
    return $window;
  };



  /*图书显示页面*/
  var userTemplateforTag = new URITemplate();
  //跳转到登录界面
  var loginFirst = function(){
    showWindow('登录之后才能进一步操作',function(){
      var redirectUrl = $('#login_url').attr('href'),
          currentUrl = window.location.href;
     window.location =redirectUrl+'?redirectTo='+currentUrl;
    });
     return false;
  };

  var userid = $('meta[name="user-id"]').attr('content'),
      bookid = $('meta[name="book-id"]').attr('content'),
      bookname = $('meta[name="book-name"]').attr('content');

  //检查是否已经收藏
  if(userid){
    var $favorButton = $('#favor'),
        orgHtml = $favorButton.html();

    $favorButton.html(waiting());
    $.ajax({
      url:userTemplateforTag.urlFor('user_book',userid,bookid),
      method:'GET',
    })
    .done(function(data){
      $favorButton.html('取消收藏');
      $favorButton.data('collected',true);
    })
    .fail(function(jqxhr,code,err){
      if(jqxhr.status === 404){
        $favorButton.html('收藏');
      }else{
        $favorButton.html(orgHtml);
      }
    });
  }

  //收藏按钮
  $('#favor').click(function(){
    var $this = $(this),
        orgHtml = $this.html(),
        isCollected = $this.data('collected');
    if(!userid){
       //需要登录
       return loginFirst();
    }
    if(isCollected){
      //取消收藏
      $this.html(waiting());
      $.ajax({
        url: userTemplateforTag.urlFor('user_book',userid,bookid),
        method:'DELETE',
        processData:false,
        data:{}
      })
      .done(function(data){
        if(data.code === 200){
          $this.html('收藏');
          $this.data('collected',false);
        }
      })
      .fail(function(jqxhr,code,err){
        message('danger','取消收藏失败'+code+': '+err);
        $this.html(orgHtml);
      });
    }else{
      //获取当前读者的所有标签
      $this.html(waiting());
      $.ajax({
        url:userTemplateforTag.urlFor('user_tags',userid),
        method:"GET",
        data:{}
      })
      .done(function(data){
        var tags = data.tags || [],
            $tagContent = $('#tags-content').clone().removeClass('hidden'),
            $inputer = $tagContent.children('#taginputer'),
            $noteInputer = $tagContent.children('#noteinputer'),
            $myTags = $tagContent.children('#my-tags'),
            $tagContainer = $('<span>').addClass('user-tag'),
            recommendTags = $('meta[name="book-tags"]').attr('content').split(' '),
            $recommendTags = $tagContent.children('#recommend-tags');


        $inputer.data('tags',[]);
        //添加到表单中
        var addToInputer = function(tag){
          tag = tag.trim();
          var tags = $inputer.data('tags');
          if(!_.includes(tags,tag)){
            tags.push(tag);
            $inputer.data('tags',tags);
            $inputer.val(tags.join(' '));
          }
        };

        //表单变化，保持其唯一性
        $inputer.change(function(){
          var value = $inputer.val(),
              tags = value.split(' ');
          tags = _.uniq(tags);
          $inputer.val(tags.join(' '));
          $inputer.data(tags);
        });

        tags.forEach(function(tag){
          $tagContainer.clone().html(tag).appendTo($myTags)
            .click(function(event){
              //添加到表单中
              addToInputer(tag);
            });
        });
        //推荐的标签
        recommendTags.forEach(function(tag){
          $tagContainer.clone().html(tag).appendTo($recommendTags)
            .click(function(event){
              addToInputer(tag);
            });
        });

        var $window = showWindow($tagContent,function(){
          //收藏
          var tags = $inputer.val().trim();
          if(tags === ''){
            return '标签不能为空'; //在窗口显示标签不能为空
          }
          tags = _.map(tags.split(' '),function(value){return value.trim();});
          $.ajax({
            url: userTemplateforTag.urlFor('user_books',userid),
            method:"POST",
            processData:false,
            data:{
              tags:tags,
              book_id:bookid,
              book_name:bookname,
              notes:$noteInputer.val().trim()
            }
          })
          .done(function(){
            $this.html('取消收藏').data('collected',true);
          })
          .fail(function(jqxhr,code,err){
            if(jqxhr.status === 409){
              $this.html('取消收藏').data('collected',true);
            }else{
              message('danger','收藏失败');
              $this.html(orgHtml);
            }
          });
        });

        //用户关闭窗口
        $window.on('window.hide.cancel',function(){
          $this.html(orgHtml);
        });
      })
      .fail(function(jqxhr,code,err){
        message('danger','请求失败 '+code +": "+err);
        $this.html(orgHtml);
      });
    }
    return false;
  });

  /**********评论**************/
  var $addComment = $('#add-comment'),
      $commentContent = $('#comment-content');

  if(!userid){
    //未登录
    $addComment.addClass('disabled').html('未登录')
      .click(function(){
        return loginFirst();
      });
    $commentContent.attr('disabled',true);
  }

  /*评星*/
  var hover = function(event){
    var $this = $(this),
        $parent = $this.parent('.star'),
        $score = $('.star-score'),
        initValue = $parent.data('value'),
        value = $this.data('value');

    $parent.toggleClass('star-'+initValue);
    $parent.toggleClass('star-'+value);
    if(event.type === "mouseenter"){
      $score.html(value);
    }else{
      $score.html(initValue);
    }
  };

  $('.star-inner')
  .hover(hover,hover)
  .click(function(){
    var $this = $(this),
        $parent = $this.parent('.star'),
        $score = $('.star-score'),
        value = $this.data('value');

    $parent.addClass('star-'+value);
    $parent.data('value',value);
    $('input[name="score"]').val(value);
    $score.html(value);
  });

  var setStar = function(value,relative_value){
    var $star = $('#dynamic-star'),
        $score = $('.star-score');

    $star.removeClass('star-'+relative_value)
      .addClass('star-'+value)
      .data('value',value);
    $('input[name="score"]').val(value);
    $score.html(value);
  };

  /*********回复*********/
  var $commentList = $('.comment-list'),  //回复列表
      $commentDescription = $('.comment-description'),
      $commentStatus = $('.comment-status');

  //添加回复到列表中
  var newCommentItem = function(data){
    var commentItem = null;
    if(data.deleted){
      commentItem = $('<div class="comment-item-deleted">').html(data.comment_id + ' 楼已删除');
    }else{
      commentItem = Template.comment_item({// jade 客户端模板
        comment_id: data.comment_id,
        current_userid: userid,                    //当前登录用户
        username: data.user.name,                  //用户姓名
        user_id: data.user.id,                     //用户id
        avatar:  data.user.avatar,                 //头像
        url_for_user: userTemplateforTag.urlFor('user',data.user.id),
        date: new Date(data.created_on),           //回复时间
        reply_id: data.reply_id,                   //被回复的楼层
        reply_username: data.reply_user.name,      //被回复者姓名
        url_for_reply_user: data.reply_user.id && userTemplateforTag.urlFor('user',data.reply_user.id),                           //被回复者的主页
        content: data.content,                     //内容
        rank:data.rank,                            //评级
        likes:data.ups.length,                     //被赞次数
        liked: _.includes(data.ups,userid)         //是否已经赞过
      });
    }
    $commentList.append(commentItem);
    return $commentList.children('#'+data.comment_id);
  };

  //获取图书的评论列表
  $.ajax({
    url:userTemplateforTag.urlFor('book_comments',bookid),
    method:'GET'
  })
  .done(function(data){
    $commentStatus.html('');
    data.comments.forEach(function(value){
      newCommentItem(value);
    });
  })
  .fail(function(jqxhr,code,err){
    $commentStatus.html('获取评论列表失败 ' + code +': '+err);
  });

  //添加一条回复
  $addComment.click(function(event){
    var $this = $(this),
        orgHtml = $this.html(),
        //获取参数
        content = $commentContent.val().trim(),
        $rank = $('input[name="score"]'),
        rank  =  $rank.val(),
        $reply_id = $('input[name="reply_id"]'),
        reply_id = $reply_id.val() === '-1' ? null : $reply_id.val(),
        $reply_user = $('input[name="reply_user"]'),
        reply_user = $reply_user.val() || null,
        $reply_userid = $('input[name="reply_userid"]'),
        reply_userid = $reply_userid.val() || null;

    if(content === ''){
      return false;
    }

    $this.html(waiting());
    $.ajax({
      url: userTemplateforTag.urlFor('book_comments',bookid),
      method:'POST',
      processData:false,
      data:{
        book_name:bookname,
        content:content,
        rank:rank,
        user_id:userid,
        reply_id:reply_id,
        reply_user_id:reply_userid,
        reply_user_name: reply_user
      }
    })
    .done(function(data){
      //清空评论框
      $commentContent.val('');
      setStar(0,rank);
      $reply_id.val(-1);
      $reply_user.val('');
      $reply_userid.val('');
      $commentDescription.html('');
      $('#book-comments .book-star').removeClass('hidden');

      var $commentItem = newCommentItem(data.comment);
      $this.html(orgHtml);
      $commentStatus.html('');
      //跳转到评论
      $('html').animate({scrollTop: $commentItem.offset().top});
    })
    .fail(function(jqxhr,code,err){
      $this.html(orgHtml);
      $commentStatus.html('评论失败 ' + code +': '+err);
    });
  });

  //删除评论
  $commentList.on('click','.comment-delete',function(event){
    var $this = $(this),
        $parent = $this.closest('.comment-item'),
        comment_id = $parent.data('id'),
        belongUserid = $parent.data('userid');
    $.ajax({
      url: userTemplateforTag.urlFor('book_comment',bookid,comment_id),
      method:'DELETE',
      processData:false,
      data:{
        user_id:userid
      }
    })
    .done(function(data){
      var commentItem = $('<div class="comment-item-deleted">').html(comment_id + ' 楼已删除');
      $parent.slideUp();
      $parent.replaceWith(commentItem).slideDown();
    })
    .fail(function(jqxhr,code,err){
      message('danger','删除失败 '+ code +": "+err);
    });
  });

  //回复评论
  $commentList.on('click','.comment-reply',function(event){
    var $this = $(this),
        $parent = $this.closest('.comment-item'),
        comment_id = $parent.data('id'), //回复的楼数
        username = $parent.data('user'),
        userid = $parent.data('userid'); //回复的用户

    $('input[name="reply_id"]').val(comment_id);
    $('input[name="reply_user"]').val(username);
    $('input[name="reply_userid"]').val(userid);
    $commentDescription.html('回复')
      .append($('<a class="id">').attr('href','#'+comment_id).html(comment_id))
      .append($('<a class="user">').attr('href',userTemplateforTag.urlFor('user',userid)).html(username));
    //隐藏评级
    $('#book-comments .book-star').addClass('hidden');
    //显示回复框
    $('html').animate({scrollTop:$commentDescription.offset().top - 200});
    $('#comment-content').focus();
  });

  //赞
  $commentList.on('click','.comment-agree',function(event){
    var $this = $(this),
        $parent = $this.closest('.comment-item'),
        comment_id = $parent.data('id'),
        liked = $this.data('liked');
    if(!userid)
      return loginFirst();
    
    if(liked){
      //取消赞
      $.ajax({
        url: userTemplateforTag.urlFor('book_comment_like',bookid,comment_id,userid),
        method:"DELETE",
        processData:false,
        data:{}
      })
      .done(function(data){
        $parent.data('likes',data.value);
        $this.data('liked',false);
        $this.children('.ups').html(data.value);
      })
      .fail(function(jqxhr,code,err){
        message('danger','取消赞失败 '+ code +": "+err);
      });
      return false;
    }

    $.ajax({
      url: userTemplateforTag.urlFor('book_comment_likes',bookid,comment_id),
      method:"POST",
      processData:false,
      data:{
        user_id:userid,
      }
    }).done(function(data){
      $parent.data('likes',data.value);
      $this.data('liked',true);
      $this.children('.ups').html(data.value + ' 取消赞');
    })
    .fail(function(jqxhr,code,err){
      if(jqxhr.status === 409){
        //已赞过了
        $this.data('liked',true);
        $this.children('.ups').html($parent.data('likes') + ' 取消赞');
      }else{
        message('danger','赞失败 '+ code +": "+err);
      }
    });
  });

});
