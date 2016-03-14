var $refresh = $('<span>').addClass('glyphicon glyphicon-repeat rotate'),
    $alert = function(type,value,target){
      var $closeButton = $('<button class="close" data-dismiss="alert"></button>')
        .html($('<span>&times;</span>')),
         _t = $('<div>').addClass('alert alert-dismissible')
        .addClass('alert-'+type)
        .html(value).
        append($closeButton);
      if(target){
        target.prepend(_t);
      }
      return _t;
    };

//提示信息
var message = function(type,value){
  var $banner = $alert(type,value,$('.main'));
  $('html').animate({scrollTop: $banner.offset().top});
  //20秒后删除提示信息
  window.setTimeout(function(){
    $banner.remove();
  },20000);
};

var waiting = function(){
  return $refresh.clone();
};

var getMeta = function(key){
  var elm = $('meta[name="'+key+'"]');
  if(elm.length > 0){
    return elm.attr('content');
  }else{
    return null;
  }
};

//url模板
var URITemplate = function(){
  //获取
  var $urlTemplate = $('meta[name="url-template"]'),
      $urlReplacement = $('meta[name="url-replacement"]');
  if($urlTemplate.length > 0 && $urlReplacement.length > 0){
    this._template = JSON.parse($('meta[name="url-template"]').attr('content'));
    this._replacement = JSON.parse($('meta[name="url-replacement"]').attr('content'));
  }else{
    this._disabled = true;
  }
};

URITemplate.prototype.urlFor = function(resource){
  if(this._disabled){
    return false;
  }
  var args = Array.prototype.slice.call(arguments);
  args.shift();
  if(!this._template.hasOwnProperty(resource)){
    throw Error('unkown resource of ' + resource);
  }else{
    var template = this._template[resource],
        replacement = this._replacement[resource];

    if(args.length !== replacement.length){
      throw new Error('require ' + replacement.length + ' replacements :' + replacement.join(','));
    }
    for(var i = 0;i < replacement.length;i++){
      template = template.replace(replacement[i],args[i]);
    }
    return template;
  }
};

$(document).ready(function(){
  //before ajax send
  $.ajaxSetup({
    contentType:'application/json',
    dataType:'json',
    data:{}
  });

  $(document).ajaxSend(function(event,jxhr,options){
    //append csrf token
    if(options.data){
      var param_name = $('meta[name="csrf-param"]').attr('content'),
          token = $('meta[name="csrf-token"]').attr('content');
      options.data[param_name]=token;
      //stringify object
      options.data = JSON.stringify(options.data);
    }
  });

  //delete button
  $('#delete-btn,.delete-btn').click(function(evt){
    var $target = $(this);
    if(window.confirm('确定删除? 删除后不可恢复')){
      $target.html(waiting());
      $.ajax({
        url:$target.attr('href'),
        method: 'DELETE',
        processData:false,
        data:{}
      })
      .done(function(data){
        $target.html("已删除");
        //TODO redirect
      })
      .fail(function(){
        $target.html("删除失败");
      });
    }
    return false;
  });

  //foldable-list
  $('.foldable-list').on('click','.foldable-list-title',function(event){
    var $this = $(this),
        $body = $this.next('.foldable-list-body');
    $this.toggleClass('dropup');
    $body.slideToggle();
  });

  /*折叠按钮*/
  var moreButton = $('<span class="more-button drop-down">展开</span>');
  moreButton.click(function(event){
    var $this = $(this),
        $foldTarget = $this.data('fold'),
        height = $foldTarget.data('orginalHeight'),
        scrollHeight = $foldTarget.data('scrollHeight');
    if($this.hasClass('drop-down')){
      //show more
      $foldTarget.css('height',scrollHeight);
      $this.html('收起');
    }else{
      //show less
      $foldTarget.css('height',height);
      $this.html('展开');
    }
    $this.toggleClass('drop-down');
  });

  $('.foldable').each(function(){
    var scrollHeight = this.scrollHeight,
        $this = $(this);
    $this.data('orginalHeight',$this.outerHeight());
    $this.data('scrollHeight',scrollHeight);
    if(scrollHeight > 139){ //需要折叠
      $this.parent().append(moreButton.clone(true).data('fold',$this));
      $this.css('maxHeight','none');
      //TODO
    }
  });

  //用户登录状态显示
  $('.navbar-user-status-item.dropdownable').click(function(event){
    var $this = $(this),
        $list = $this.next('.navbar-user-status-list');
    if($list.length !== 0){
      //存在下拉框
      $list.toggleClass('drop-up');
    }
    return false;
  });

  $('body').click(function(event){
    $('.navbar-user-status-list').addClass('drop-up');
  });

  //组件
  
  //全选
  $('.check-all').click(function(event){
    var $this = $(this),
        target = $this.data('target');
    $(target).attr('checked','checked');
    return false;
  });
});

