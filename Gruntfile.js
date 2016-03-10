var path = require('path');


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

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default',['jade']);
};
