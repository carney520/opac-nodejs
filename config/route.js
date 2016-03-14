/*define routes */
var url_for = require('../middlewares/url_for');
var controllers = require('../app/controllers/index');

module.exports = function(app){
  app.use(url_for);
  /*
   * TODO
   * /books
   * /login -for user
   * /library/login -for admin
   * /system/login -for super
   * /system/readers
   */


  /*
   * @subsystem: 系统管理
   * @prefix: /system
   */

  var system = controllers.system,
      system_prefix = system.prefix;
  app.use(system_prefix,system.before);

  var system_index = app.register('/',system_prefix);
  system_index.get('/',system.index);
  system_index.route('/login')
    .get(system.login)
    .post(system.authentication);

  /*
   * @resource Readers
   * @path:
   */

  var readers = app.register(system_prefix,'readers'),
      readerController = system.reader;

  //app.use('/readers',readers);
  readers.use(readerController.before);
  readers.route('/')
    .get(readerController.index)
    .post(readerController.create);
  readers.get('/new',readerController.new);
  readers.route('/:card_no')
    .get(readerController.show)
    .put(readerController.update)
    .delete(readerController.destroy);
  readers.get('/:card_no/edit',readerController.edit);
  readers.put('/:card_no/status',readerController.update_status);

  /*
   * @resource Admins
   * @path:
   *
   */
  var admins = app.register(system_prefix,'admins'),
      adminController = system.admin;
  
  admins.use(adminController.before);
  admins.route('/')
    .get(adminController.index)
    .post(adminController.create);
  admins.get('/new',adminController.new);
  admins.route('/:card_no')
    .get(adminController.show)
    .put(adminController.update)
    .delete(adminController.destroy);
  admins.get('/:card_no/edit',adminController.edit);

  /*
   * @resource Rules
   * @path:
   *       /system/rules  GET all Rules
   *                      POST create one rules
   *       /system/rules/new  GET page to create rule
   *       /system/rules/:id GET rule
   *                         PUT modify rule
   *                         DELETE delete rule
   *       /system/rules/:id/edit GET page to modify rule
   */
  var rules = app.register(system_prefix,'rules'),
      ruleController = system.rule;
  rules.use(ruleController.before);
  rules.route('/')
    .get(ruleController.index)
    .post(ruleController.create);
  rules.get('/new',ruleController.new);
  rules.route('/:id')
    .get(ruleController.show)
    .put(ruleController.update)
    .delete(ruleController.destroy);
  rules.get('/:id/edit',ruleController.edit);

  /*
   * @resource CollectionSite 借阅室or藏书位置
   * @path:
   *       /system/collection_sites  GET all Collection Site
   *                                 POST create one collection site
   *       /system/collection_sites/new  GET page to create collection site
   *       /system/collection_sites/:id GET collection site by id
   *                                    PUT modify collection site
   *                                    DELETE delete collection site
   *       /system/collection_sites/:id/edit GET page to mofify collection site
   */

  var collection_sites = app.register(system_prefix,'collection_sites'),
      collectionSiteController = system.collectionSite;

  collection_sites.use(collectionSiteController.before);
  collection_sites.route('/')
    .get(collectionSiteController.index)
    .post(collectionSiteController.create);
  collection_sites.get('/new',collectionSiteController.new);
  collection_sites.route('/:id')
    .get(collectionSiteController.show)
    .put(collectionSiteController.update)
    .delete(collectionSiteController.destroy);
  collection_sites.get('/:id/edit',collectionSiteController.edit);

  /*
   * @resource: categories
   * @path: 
   *      /system/categories/ GET   manage book categories
   *      /system/categories/ POST  add one category 
   *      /system/categories/:id PUT  update one category 
   *      /system/categories/:id POST  add one sub-category 
   *      /system/categories/:id DELETE  delete category 
   *      /system/categories/:id/children/:child_name DELETE  delete sub-category 
   */

  var categories = app.register(system_prefix,'categories'),
      categoryController = system.category;

  categories.use(collectionSiteController.before);
  categories.route('/')
    .get(categoryController.index)
    .post(categoryController.create);
  categories.route('/:id')
    .put(categoryController.update)
    .post(categoryController.create_child)
    .delete(categoryController.destroy);
  categories.delete('/:id/children/:child_name',categoryController.destroy_child);

  /*
   * @subsystem: 图书管理
   * @prefix: /library
   * 说明：
   *     book是图书的一些信息，collection是指藏书，相当于book的实例
   */

  var library = controllers.library,
      library_prefix = library.prefix;
  app.use(library_prefix,library.before);
  var library_index = app.register('/',library_prefix);
  library_index.get('/',library.index);
  library_index.route('/login')
    .get(library.login)
    .post(library.authentication);

  /*
   * @resource: Book
   * @path:
   *        /library/books  GET 获取和搜索图书
   *        /library/books  POST 添加图书
   *        /library/books/new
   *        /library/books/:id GET 图书详情
   *        /library/books/:id PUT 修改图书
   *        /library/books/:id DELETE 删除图书
   *        /library/books/:id/edit GET 图书修改页面
   *        藏书
   *        /library/books/:id/collections GET 获取指定图书的藏书状态
   *                                       POST 添加藏书
   *        /library/books/:id/collections/:cid PUT 修改指定图书的藏书状态
   *                                            DELETE 删除
   *                                            GET  获取
   */

  var intl_books = app.register('/library','intl_books'),
      intlBookController = library.book,
      intlBookCollectionController = library.collection,
      intlBookBorrowedController = library.borrowed;

  intl_books.use(intlBookController.before);
  intl_books.route('/')
    .get(intlBookController.index)
    .post(intlBookController.create);
  intl_books.get('/new',intlBookController.new);
  intl_books.get('/search',intlBookController.search);
  intl_books.route('/:id')
    .get(intlBookController.show)
    .put(intlBookController.update)
    .delete(intlBookController.destroy);
  intl_books.get('/:id/edit',intlBookController.edit);

  intl_books.route('/:id/collections','collections')
    .get(intlBookCollectionController.index)
    .post(intlBookCollectionController.create);
  intl_books.get('/:id/collections/new','collection_new',intlBookCollectionController.new);
  intl_books.route('/:id/collections/:collection_id','collection')
    .get(intlBookCollectionController.show)
    .put(intlBookCollectionController.update)
    .delete(intlBookCollectionController.destroy);
  intl_books.get('/:id/collections/:collection_id/edit','collection_edit',intlBookCollectionController.edit);

  intl_books.post('/borroweds',intlBookBorrowedController.create);             //借书
  intl_books.delete('/borroweds/:accession_no',intlBookBorrowedController.destroy);      //还书


  /*
   *
   * @subsystem: entry
   *          公共服务入口
   *          /             GET   图书搜索主页
   *          /login        GET   读者登录页面
   *                        POST  登录认证
   *          /logout       GET   退出登录
   *          /books
   *          /books/search GET   图书搜索结果页面
   *          /books/id     GET   图书详情
   *          /users/:card_no        GET   读者首页
   *                                 PUT   修改读者资料
   *          /users/:card_no/password PUT   修改密码
   *          /users/:card_no/tags    GET   读者收藏图书
   *          /users/:card_no/tags/:tag_name   GET   指定标签收藏图书
   *                                           PUT   新建标签
   *                                           POST   添加收藏图书
   *                                           DELETE 删除标签
   *          /users/:card_no/tags/:tag_name/books/:book_id   DELETE   删除收藏图书
   *
   *
   */

  var main = controllers.main,
      main_prefix = main.prefix;
  app.use(main_prefix,main.before);

  var main_index = app.register(main_prefix,'main',true);
  main_index.get('/',main.index);
  main_index.get('/logout',main.logout);
  main_index.route('/login')
    .get(main.login)
    .post(main.authentication);


  /*
   * @resource users
   *           读者资料
   */
  var userController = main.user,
      tagController = main.tag,
      bookController = main.book,
      commentController = main.comment;

  user = app.register(main_prefix,'users');
  user.route('/:card_no')
    .get(userController.show)
    .put(userController.update);
  user.put('/:card_no/password',userController.change_password);
  /*借阅*/
  user.get('/:card_no/borroweds',userController.get_borrowed);
  user.put('/:card_no/borroweds/:accession_no',userController.renew);

  /*图书收藏*/
  user.route('/:card_no/books')
    .get(tagController.index)
    .post(tagController.create);           //收藏图书
  user.route('/:card_no/books/:book_id')
    .delete(tagController.destroy)
    .get(tagController.is_collected); //是否收藏了图书 
  user.route('/:card_no/tags')
    .get(tagController.tags);            //获取所有标签
  user.route('/:card_no/tags/:tag_name')  //获取指定标签的图书集合
    .get(tagController.show);

  var book = app.register('/','books');
  book.get('/',bookController.index);
  book.get('/search',bookController.search);
  book.get('/:id',bookController.show);
  /*图书评论*/
  book.route('/:id/comments')
    .post(commentController.create)  //新建一条回复
    .get(commentController.index);
  book.delete('/:id/comments/:reply_no',commentController.destroy);
  book.post('/:id/comments/:reply_no/likes',commentController.like); //赞
  book.delete('/:id/comments/:reply_no/likes/:card_no',commentController.undo_like); //取消赞

  //杂项
  var misc = app.register('/','misc',true);

  misc.get('/rules');                      //借阅规则
  var test = app.register('/','tests');
  test.get('/',intlBookBorrowedController.create);
  test.get('/return',intlBookBorrowedController.destroy);


  console.log(admins.p);

  //Error handlers
  app.use(controllers.errorHandlers);
};
