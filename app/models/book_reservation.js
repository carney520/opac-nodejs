var mg = require('mongoose')
var Schema = mg.Schema

var BookReservationSchema = new Schema({
  //预约用户id
  user_id: { type: String, index: true, required: true },
  //预约用户名
  user_name: { type: String, required: true },
  //图书是否可用，即图书是否返回，若返回，book_available 为true，预约会在规定时间后失效，那么队列的下一个预约者获得图书
  book_available: { type: Boolean, default: false },
  //图书可用的起始日期，用于计算失效日期
  book_available_date: { type: Date },
  //预约的时间，队列根据它来排序
  reservation_date: { type: Date, default: Date.now },
  //当图书可用后，最后可取书的时间，超过这个时间将会让给下一个预约者,然后删除记录
  latest_loan_date: { type: Date },

  //图书信息
  book_id: { type: Schema.Types.ObjectId, index: true, required: true },
  book: {
    name: { type: String },
    author: { type: String },
    book_type: { type: String },
  },
})

//获取第一个正在等待的预约读者
BookReservationSchema.statics.peek = function(bookid) {
  var Model = this
  return Model.find({ book_id: bookid, book_available: false })
    .sort({ reservation_date: 1 })
    .limit(1)
}

module.exports = mg.model('BookReservation', BookReservationSchema)
