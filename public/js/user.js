$(document).ready(function(){
  
  $('#goto-modify').click(function(){
    $('#modify-tab').tab('show');
    return false;
  });

  $('#goto-change-password').click(function(){
    $('#change-password-tab').tab('show');
    return false;
  });

  $('.backto-profile').click(function(){
    $('#profile-tab').tab('show');
    return false;
  });

  $('.user-change-password form').submit(function(){
    $('.has-error').removeClass('has-error');
    var $this = $(this),
        $oldPassword = $('#old-password'),
        $newPassword = $('#new-password'),
        $verify = $('#verify-password');
    if($oldPassword.val() === '' || $newPassword.val() ==='' || $verify.val() === ''){
      message('danger','密码不能为空');
      return false;
    }

    if($newPassword.val() !== $verify.val()){
      $verify.val('');
      $verify.parent().addClass('has-error');
      message('danger','密码不一致');
      return false;
    }
  });

  /******** 收藏 *********/
  //收藏条目容器
  var $booksContainer =$('.books-container tbody'),
      $next = $('.books-container .next'),
      urlTemplate = new URITemplate(),
      userid = getMeta('user-id');

  var addToBooksContainer = function(books){
    var $tr = $('<tr>'),
        $td = $('<td>');
    books.forEach(function(book){
      var date = new Date(book.collection_date),
          dateString = date.getFullYear() +"年" + (date.getMonth()+1) + "月" +
            date.getDate() + "日";
          $book = $('<a>').attr('href',urlTemplate.urlFor('book',book.book_id))
            .html(book.name);
      $tr.clone()
        .append($td.clone().html($book))
        .append($td.clone().html(book.tags.join(',')))
        .append($td.clone().html(book.notes))
        .append($td.clone().html(dateString))
        .data('tags',book.tags)
        .appendTo($booksContainer);
    });
  };

  var checkNextPageAndAppendData = function(data){
    if(data.count > 0){
      if((data.start + data.count) < data.total){
        $next.data('total',data.total);
        $next.data('start',data.start);
        $next.data('count',data.count);
        $next.removeClass('hidden');
      }else{
        //隐藏下一页按钮
        $next.addClass('hidden');
      }
      addToBooksContainer(data.collections);
      $booksContainer.children('tr').removeClass('actived');
    }else{
      $next.addClass('.hidden');
    }
  };

  $('#favor-tab').on('show.bs.tab',function(){
    var $this = $(this);
    if($this.data('showed')){
      return true;
    }else{
      //获取收藏数据
      var start = 0,
          count = 20;

      //第一次请求
      $.ajax({
        url: urlTemplate.urlFor('user_books',userid),
        method:'GET',
        data:{
          start:start,
          count:count
        }
      })
      .done(function(data){
        checkNextPageAndAppendData(data);
        $this.data('showed',true);
      })
      .fail(function(jqxhr,code,err){
        message('danger','请求失败'+code+': '+err);
      });
    }
  });

  //下一页
  $next.click(function(){
    var $this = $(this),
        start = parseInt($this.data('start')),
        count = parseInt($this.data('count'));
    //组织请求下一页
    start = start + count;
    $.ajax({
      url:urlTemplate.urlFor('user_books',userid),
      method:'GET',
      data:{
        start:start,
        count:count
      }
    })
    .done(function(data){
      checkNextPageAndAppendData(data);
    })
    .fail(function(jqxhr,code,err){
      message('danger','请求失败'+code+': '+err);
    });
  });

  //点击标签,点亮相关标签的书
  $('.user-tag a').click(function(){
    var $rows = $booksContainer.children('tr'),
        tagName = $(this).html().trim();
    $rows.each(function(){
      var $this = $(this);
      if(_.includes($this.data('tags'),tagName)){
        $this.addClass('actived');
      }else{
        $this.removeClass('actived');
      }
    });
    return false;
  });

  /* 借阅 */
  $('#borroweds-tab').on('show.bs.tab',function(){
    var $this = $(this);
    if($this.data('showed')){
      return true;
    }else{
      //显示当前借阅情况
      var $borrowedsList = $('#borroweds-list'),
          $status = $('.load-status-for-borroweds'),
          $historyList = $('#history-list'),
          $historyStatus = $('.load-status-for-history');
      //获取借阅列表
      $.ajax({
        url: urlTemplate.urlFor('user_borroweds',userid),
        method:'GET',
      })
      .done(function(data){
        var results = data.results;
        $status.html('');
        results.forEach(function(result){
          result.book_url =urlTemplate.urlFor('book',result.book_id);
          $(Template.borroweds_item(result)).appendTo($borrowedsList);
        });
      })
      .fail(function(jqxhr,code,err){
        $status.html('获取借阅记录失败' + code +': ' +err);
      });

      //获取借阅历史
      $.ajax({
        url: urlTemplate.urlFor('user_borroweds',userid),
        method: 'GET',
        data:{
          history:true,
          start:0,
          count:15
        }
      })
      .done(function(data){
        var $nextPage = $('.next-page'),
            total = data.total,
            start = data.start,
            count = data.count,
            results = data.results;
        $historyStatus.html('');
        //是否有下一页
        if((start+count) < total){
          $nextPage.removeClass('hidden').data('start',start).data('count',count);
        }
        results.forEach(function(result){
          result.book_url = urlTemplate.urlFor('book',result.book_id);
          $(Template.borroweds_history_item(result)).appendTo($historyList);
        });
      })
      .fail(function(jqxhr,code,err){
        $historyStatus.html('获取借阅历史失败' + code +': ' +err);
      });
      $this.data('showed',true);
    }
  });

  //续借
  $('#renew').click(function(event){
    //获取所有选取的书籍
    var $status = $('.load-status-for-borroweds');
    $('input[name="accession_no"]:checked').each(function(){
      var $this =$(this),
          $parent = $this.closest('tr'),
          accession_no = $this.val();
      $.ajax({
        url:urlTemplate.urlFor('user_borrowed',userid,accession_no),
        method:'PUT',
        processData:false,
        data:{}
      })
      .done(function(data){
        //续借成功
        var result = data.result;
        result.book_url = urlTemplate.urlFor('book',result.book_id);
        $status.append('<div>访问号:'+accession_no +'续借成功</div>');
        $parent.replaceWith(Template.borroweds_item(result));
      })
      .fail(function(jqxhr,code,err){
        var res = jqxhr.responseJSON,
            status = res.status,
            message = res.message;
        if(status === 403){
          switch(message){
            case 'forbidden':
              $status.append('<div>访问号:'+accession_no +'续借失败，没有操作权限</div>');
              break;
            case 'overdue':
              $status.append('<div>访问号:'+accession_no +'续借失败，图书已超期</div>');
              break;
            default:
              $status.append('<div>访问号:'+accession_no +'续借失败，不能续借</div>');
          }
        }else{
          $status.append('<div>访问号:'+accession_no +'续借失败'+err+'</div>');
        }
      });
    });
  });



});
