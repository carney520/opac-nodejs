var mg = require('mongoose');
var Schema = mg.Schema;

var bookBorrowedHistorySchema = new Schema({
  user_id:{type:Schema.Types.ObjectId,index:true,required:true},
  loan_period:{type:Date, default:Date.now},
  due_date:{type:Date},
  book_id:{type:Schema.Types.ObjectId,required:true},
  name:{type:String, required:true},
  accession_no:{type:String, required:true}
});

module.exports = mg.model('BookBorrowedHistory',bookBorrowedHistorySchema);
