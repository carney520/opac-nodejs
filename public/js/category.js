$(document).ready(function() {
  //uri 模版解析器
  var urltemplate = new URITemplate()
  //组件
  //表格容器
  var $categoriesList = $('#categories-list')
  //删除按钮
  var $delete = $('<button class="btn delete-category">删除</button>')
  //添加按钮
  var $addChild = $('<button class="btn add-child">添加子分类</button>')
  //修改按钮
  var $update = $('<button class="btn update-category">修改</button>')
  //单元格
  var $td = $('<td>')
  var td = function(inner) {
    if (inner) return $td.clone().append(inner.clone())
    else return $td.clone()
  }
  var $modalInput = $('<input id="modal-input" type="text">'),
    modalInput = function(value) {
      return $modalInput.clone().val(value)
    }

  $('#add-category').click(function(event) {
    var $input = $('input[name="category"]'),
      $this = $(this),
      $cancel = $('<button id="cancel-add">取消</button>').addClass('add-btn')
    $cancel.click(function() {
      $input.addClass('add-input-hidden')
      $(this).remove()
      return false
    })

    if ($input.hasClass('add-input-hidden')) {
      $input.removeClass('add-input-hidden')
      $this.after($cancel)
    } else {
      //添加分类
      var value = $input.val(),
        orgHTML = $this.html()
      if (value === '') return false
      //发起请求
      $this.html(waiting())
      $.ajax({
        url: urltemplate.urlFor('categories'),
        method: $this.data('method'),
        processData: false,
        data: {
          name: value,
        },
      })
        .done(function(data) {
          $this.html(orgHTML)
          //添加成功
          message('success', '已添加分类: ' + data.name)
          $input.addClass('add-input-hidden')
          $this.next('#cancel-add').remove()
          //添加进列表
          var $item = $('<tr>')
            .addClass('category-item')
            .data('id', data.id)
            .on('click', '.update-category', 'update', categoryMethod)
            .on('click', '.add-child', 'addChild', categoryMethod)
            .on('click', '.delete-category', 'delete', categoryMethod)
            .on('dblclick', '.category-child', 'delete-child', categoryMethod) //绑定事件

          $item
            .append(td().html(data.name).addClass('category-name'))
            .append(td().addClass('sub-categories'))
            .append(td($delete))
            .append(td($addChild))
            .append(td($update))

          $categoriesList.append($item)
        })
        .fail(function(jqxhr, code, err) {
          $this.html(orgHTML)
          if (jqxhr.status === 409) {
            message('danger', '添加失败：已存在名为"' + value + '"的分类')
          } else {
            message('danger', '添加失败: ' + err)
          }
        })
    }
    return false
  })

  $('.category-item')
    .on('click', '.update-category', 'update', categoryMethod)
    .on('click', '.add-child', 'addChild', categoryMethod)
    .on('click', '.delete-category', 'delete', categoryMethod)
    .on('dblclick', '.category-child', 'delete-child', categoryMethod) //绑定事件

  /* 显示模态对话框
   * @param {String} title - 标题
   * @param {String|jQuery} content - 显示内容
   * @param {Function} callback - 点击确认按钮的回调函数
   * @param {Object} context - 回调函数绑定的上下文，可选
   */
  var showModal = function(title, content, callback, context) {
    var $modal = $('#editor'),
      $modalTitle = $('.modal-title'),
      $modalBody = $('.modal-body'),
      $modalOk = $('#modal-ok')

    context = context || null
    //change title
    $modalTitle.html(title)
    $modalBody.html(content)
    $modalOk.on('click.modal', function() {
      callback.apply(context, arguments)
      $modal.modal('hide')
    })

    //取消事件
    $modal.on('hidden.bs.modal', function() {
      $modalOk.off('click.modal')
    })
    $modal.modal('show')
  }

  //TODO 使用url模版
  function categoryMethod(event) {
    var method = event.data,
      $button = $(this), //当前点击的按钮
      $this = $(event.delegateTarget),
      id = $this.data('id'),
      url = urltemplate.urlFor('category', id),
      $currentCategory = $this.children('.category-name'),
      categoryName = $currentCategory.html(),
      $currentSubCategories = $this.children('.sub-categories'),
      subCategory = $currentSubCategories.html()

    if (method === 'update') {
      showModal('更新分类', modalInput(categoryName), function() {
        var $input = $('#modal-input'),
          value = $input.val(),
          orgHTML = $button.html()
        if (value === '') return

        //请求
        $button.html(waiting())
        $.ajax({
          url: url,
          method: 'PUT',
          processData: false,
          data: {
            name: value,
          },
        })
          .done(function(res) {
            $button.html(orgHTML)
            $currentCategory.html(res.name)
            message('success', '修改成功')
          })
          .fail(function(jqxhr, code, err) {
            $button.html(orgHTML)
            if (jqxhr.status === 409) {
              message('danger', '修改失败: 已存在名为"' + value + '"的分类')
            } else {
              message('danger', '修改失败: "' + err + '"')
            }
          })
      })
      //end of update
    } else if (method === 'delete') {
      showModal(
        '警告',
        '确认删除: <strong>' + categoryName + '</strong>?',
        function() {
          var orgHTML = $button.html()
          $button.html(waiting())
          //请求
          $.ajax({
            url: url,
            method: 'DELETE',
            processData: false,
            data: {},
          })
            .done(function(data) {
              //已删除
              message('success', '已删除:' + data.name)
              $this.remove()
            })
            .fail(function(jqxhr, code, err) {
              message('danger', '删除失败:' + err)
              $button.html(orgHTML)
            })
        }
      )
      //end of delete
    } else if (method === 'addChild') {
      showModal('输入子分类名称', modalInput(), function() {
        var $input = $('#modal-input'),
          value = $input.val(),
          orgHTML = $button.html()
        if (value === '') return
        $button.html(waiting())
        //请求
        $.ajax({
          url: url,
          method: 'POST',
          processData: false,
          data: {
            name: value,
          },
        })
          .done(function(data) {
            $button.html(orgHTML)
            message('success', '添加子分类成功: ' + data.name)
            //添加进列表
            $('<span>' + data.name + '</span>')
              .addClass('category-child')
              .appendTo($currentSubCategories)
          })
          .fail(function(jqxhr, code, err) {
            $button.html(orgHTML)
            message('danger', '添加失败: ' + err)
          })
      })
      //end of add child
    } else if (method === 'delete-child') {
      var childName = $button.html()
      //构造url
      url = url + '/children/' + childName
      showModal(
        '警告',
        '确认删除子分类: <strong>' + childName + '</strong>',
        function() {
          $button.html(waiting())
          $.ajax({
            url: urltemplate.urlFor('category_child', id, childName),
            method: 'DELETE',
            processData: false,
            data: {},
          })
            .done(function(data) {
              message('success', '删除成功: ' + childName)
              $button.remove()
            })
            .fail(function(jqxhr, code, err) {
              message('danger', '删除失败: ' + code + err)
              $button.html(childName)
            })
        }
      )
      //end of delete child
    }
    return false
  }
})
