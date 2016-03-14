$(document).ready(function(){
  var urlTemplate = new URITemplate();
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
    var $this = $(this);
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
    var data = {};
    $this.serializeArray().forEach(function(value){
      data[value.name]=value.value;
    });
    $.ajax({
      url: urlTemplate.urlFor('intl_books'),
      method:'POST',
      processData:false,
      data:data
    })
    .done(function(data){
      message('success','创建成功:'+data.name);
    })
    .fail(function(jqxhr,code,err){
      var data = jqxhr.responseJSON;
      message('danger','创建失败:'+code+": "+err+"("+ data.message +")");
    });
    event.preventDefault();
    return false;
    //ajax 提交表单
  });
});
