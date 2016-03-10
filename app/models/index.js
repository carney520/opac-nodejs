var mg = require('mongoose');

exports.Reader = require('./reader');
exports.Admin = require('./admin');
exports.Book = require('./book');
exports.BookType = require('./book_type');
exports.BookReservation = require('./book_reservation');
exports.BookBorrowedHistory = require('./book_borrowed_history');
exports.BookCollectionSite = require('./book_collection_site');
exports.BookComment = require('./book_comment');
exports.BookFavorite = require('./book_favorite');
exports.BookCategory = require('./book_category');

//创建索引失败
var callback_for_index_event = function(err){
  if(err){
    throw err; //程序级致命错误
  }
};

for(var model in exports){
  exports[model].on('index',callback_for_index_event);
}

exports.Composition = require('./composition');
