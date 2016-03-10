module.exports = {
  cookieSecret:'cookie secret',
  sessionSecret: ['session secret',"in array","don't forget"],
  mongo:{
    development:{
      connectString:'mongodb://localhost/opac'
    },
    production:{
      connectString:'mongodb://localhost/opac'
    }
  },
  redis:{
    development:{
      host:'localhost',
      port:6379,
      db:1
    },
    production:{
      host:'localhost',
      port:6379,
      db:0
    }
  }
};
