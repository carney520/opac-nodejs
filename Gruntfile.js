var path = require('path'),
    mg = require('mongoose'),
    credentials = require('./config/credentials'),
    Admin = require('./app/models/admin');


module.exports = function(grunt){
  grunt.initConfig({
    pkg:grunt.file.readJSON('package.json'),
    /* 编译客户端使用模板 */
    jade:{
      compile:{
        options:{
          client:true,
          namespace:'Template',
          processName:function(filename){
            return path.basename(filename,path.extname(filename));
          }
        },
        files:{
          "public/js/templates.js":'app/views/client/*.jade'
        }
      }
    },
    watch:{
      options:{
        reload:true
      },
      jade:{
        files:'app/views/client/*.jade',
        tasks:'jade',
      }
    }
  });


  //初始化管理账户
  grunt.registerTask('initdb','创建初始管理员',function(env){
    env = env || 'development';
    var connectString = credentials.mongo[env].connectString,
        done = this.async();
    mg.connect(connectString);
    new Admin({name:'root',card_no:'0000',password:'0000',role:'super'})
    .save()
    .then(function(data){
      if(data){
        grunt.log.writeln('创建成功');
        done();
      }
    })
    .catch(function(err){
      grunt.log.writeln('创建失败',err);
      done();
    });
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default',['jade']);
};
