var middleware = require('../../middlewares/connect-strong-params');
var expect = require('chai').expect;
describe("test connect-params",function(){
  req = {
    params:{
      name:"carney",
      age:18
    }
  };
  middleware(req);
  describe('test hash_filter',function(){
    var hash_filter = req.param.hash_filter;
    it('one',function(){
      var hash = {name:[],info:{}},
          source = {
            name:[1,2,3],
            info:{
              name:'carney',
              age:18
            }
          },
          target = {};
      hash_filter(hash,source,target);
      expect(target).to.eql(source);
    });

    it('two',function(){
      var hash = {info:['name','age']},
          source = {info:{name:'carney',age:18}},
          target = {};
      hash_filter(hash,source,target);
      expect(target).to.eql(source);
    });

    it('three',function(){
      var hash = {info:{address:['work','family']}},
          source = {info:{address:{work:'10',family:'9'}}},
          target = {};
      hash_filter(hash,source,target);
      expect(target).to.eql(source);
    });
  });
});
