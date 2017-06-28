var Pagination = function(total, current_page, count) {
  if (arguments.length === 3) {
    //计算分页
    this.total = Math.ceil(total / count)
    this.current_page = Math.ceil((current_page + 1) / count) || 1
  } else {
    this.total = total
    this.current_page = current_page
  }
}

Pagination.prototype.canPrev = function() {
  return this.current_page > 1
}

Pagination.prototype.moreThanOnePage = function() {
  return this.total > 1
}

Pagination.prototype.canNext = function() {
  return this.current_page < this.total
}

Pagination.prototype.next = function() {
  if (this.canNext()) return this.current_page + 1
}

Pagination.prototype.prev = function() {
  if (this.canPrev()) return this.current_page - 1
}

Pagination.prototype.pages = function() {
  var i,
    pages = [],
    total = this.total,
    cur = this.current_page

  var push = function(num) {
    pages.push({ no: num, active: num === cur })
  }
  if (total < 8) {
    //显示全部
    i = 1
    while (i <= total) {
      push(i)
      i += 1
    }
  } else if (cur < 5) {
    //total > 8 and current_page < 5
    ;[1, 2, 3, 4, 5].forEach(push)
    pages.push('gap')
    ;[total - 1, total].forEach(push)
  } else {
    ;[1, 2].forEach(push)
    pages.push('gap')
    ;[cur - 2, cur - 1, cur].forEach(push)
    i = total - cur - 1
    if (i >= 4) {
      ;[cur + 1, cur + 2].forEach(push)
      pages.push('gap')
      ;[total - 1, total].forEach(push)
    } else {
      while (i >= 0) {
        push(total - i)
        i -= 1
      }
    }
  }
  return pages
}

module.exports = Pagination
