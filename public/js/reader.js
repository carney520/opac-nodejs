$(document).ready(function(){
  //get csrf token
  //ban reader
  $('#reader-ban').click(function(evt){
    var $target = $(this);
    if(window.confirm("确定" + $target.html() + '?')){
      var org_html = $target.html(),
          $reader_status = $('#reader-status'),
          current_status = $reader_status.html();

      $target.html($refresh);
      $.ajax({
        url:$target.attr('href'),
        method: 'PUT',
        processData:false,
        data:{
          "status": current_status === 'logout' ? 'normal' : 'logout'
        }
      })
      .done(function(data){
        $reader_status.html(data.current_status);
        if(data.current_status === 'logout'){
          $target.html('启用');
        }
        else{
          $target.html('禁用');
        }
      })
      .fail(function(jr,status,err){
        $target.html(org_html);
      });
    }
    return false;
  });

  //delete user
});
