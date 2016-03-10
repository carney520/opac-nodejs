var mg = require('mongoose');
var Schema = mg.Schema;

var BookReservationSchema = new Schema({
  user_id:{type:Schema.Types.ObjectId,index:true,required:true},
  book_available:{type:Boolean,default:false},
  book_available_date:{type:Date},
  reservation_date:{type:Date, default:Date.now},
  latest_loan_date:{type:Date},
  book:{
    id:{type:Schema.Types.ObjectId},
    name:{type:String},
    author:{type:String},
    book_type:{type:String}
  },
});

module.exports = mg.model('BookReservation',BookReservationSchema);
