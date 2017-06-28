var mg = require('mongoose')
var Schema = mg.Schema

var bookBorrowedSchema = new Schema({
  user_id: { type: String, index: true, required: true }, //借阅人
  //图书信息
  book_id: { type: Schema.Types.ObjectId, index: true, required: true },
  name: { type: String, required: true },
  accession_no: { type: String, index: true, required: true }, //访问号，用于唯一标记一本书
  type: { type: String, required: true }, //图书类型

  //借阅信息
  created_at: { type: Date, default: Date.now, index: true }, //借阅时间
  due_date: { type: Date, required: true }, //超期时间(天)
  return_date: { type: Date }, //还书时间
  penalty: { type: Number, required: true },
  status: {
    type: String,
    default: 'lent_out',
    enum: ['lent_out', 'returned', 'overdue'],
  },
  renewals_times: { type: Number, default: 0 },
  max_times_renewals: { type: Number, required: true },
})

module.exports = mg.model('BookBorrowed', bookBorrowedSchema)
