# Opac-nodejs
Online public Access Catalog writed by nodejs

## Prerequires
这个项目依赖mongoDB和Redis, 所以需要预先安装好这些依赖. 可以在`config/credentials.js` 文件中配置mongoDB和redis的开发环境和生产环境连接地址.

在MacOS中可以使用下面命令安装上述数据库:
```shell
brew install mongodb
brew install redis
```
启动服务:
```
brew services start mongodb
brew services start redis
```

安装项目依赖:
```
npm i
```

创建初始管理员:
```
npm run initdb
```

## Run
开发环境运行:
```
npm run dev
```
