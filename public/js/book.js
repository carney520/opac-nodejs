$(document).ready(function(){
  var userTemplateforTag = new URITemplate();
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


  /* 借书模块 */
  $('.lent_out').click(function(event){
    var $this = $(this),
        accession_no = $this.data('accession_no'),
        book_id = $this.data('book_id'),
        method = $this.data('method');
        if(method === 'lent_out'){
          //借出
          showWindow($(Template.card_no_inputer(
                  {title:'请输入读者证件号',name:'card_no'})),
              function(){
                var $input = $('input[name="card_no"]'),
                    val = $input.val().trim();
                if(val === '') return;
                $this.html(waiting());
                $.ajax({
                  url:userTemplateforTag.urlFor('intl_book_borroweds'),
                  method:'POST',
                  processData:false,
                  data:{
                    accession_no:accession_no,
                    card_no:val,
                    book_id:bookid
                  }
                })
                .done(function(data){
                  //借出
                  $this.html('归还').data('method','return');
                })
                .fail(function(jqxhr,code,err){
                  var data = jqxhr.responseJSON;
                  $this.html('借书');
                  if(data.err){
                    switch(data.err){
                      case 'logout':
                        message('danger','借阅失败，该读者已被注销');
                        break;
                      case 'overdue':
                        message('danger','该读者有过期书籍');
                        break;
                      case 'reader':
                        message('danger','该读者不存在');
                        break;
                      case 'lentout':
                        message('danger','该书已借出');
                        break;
                      case 'full':
                        message('danger','达到借书上限');
                        break;
                      case 'book':
                        message('danger','该书不存在');
                        break;
                    }
                  }else{
                    message('danger','借书失败'+code+': '+err);
                  }
                });
              });
        }else{
          //还书
          var returnBook = function(amount){
            amount = 0 || amount;
            $.ajax({
              url:userTemplateforTag.urlFor('intl_book_borrowed',accession_no),
              method:'DELETE',
              processData:false,
              data:{
                book_id:bookid,
                amount:amount
              }
            })
            .done(function(data){
              $this.html('借出').data('method','lent_out');
            })
            .fail(function(jqxhr,code,err){
              var status = jqxhr.status,
                  data = jqxhr.responseJSON;
              switch(status){
                case 404:
                  message('danger','图书不存在');
                  break;
                case 402:
                  //retry
                  $window = showWindow($(Template.card_no_inputer({
                    title:'需要进行扣费-'+data.amount +'元',
                    name:'amount',
                    value:data.amount})),
                      function(){
                        var val = $('input[name="amount"]').val();
                        returnBook(val);
                      });
                  $window.on('window.hide.cancel',function(){
                    $this.html('归还');
                  });
                  break;
                default:
                  message('danger','还书失败'+code +': '+err);
              }
              $this.html('归还');
            });
          };
          returnBook();
        }
  });
});
