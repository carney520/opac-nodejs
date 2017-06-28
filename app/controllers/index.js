/* 导出子系统控制器
 *
 */

//系统公共服务入口
exports.main = require('./main/index')

//系统管理子系统
exports.system = require('./system/index')

//图书管理子系统
exports.library = require('./library/index')

//错误处理
exports.errorHandlers = require('./errorhandler')
