var mg = require('mongoose'),
    Schema = mg.Schema,
    bcrypt = require('bcryptjs');

var AdminSchema = new Schema({
  name:{type:String, index:true,required:true},
  card_no:{type:String,required:true,unique:true},
  avatar:String,
  tel: String,
  mobile: String,
  email:{type:String},
  role:{type:String,enum:['admin','super'], default:'admin'},
  password:{type:String,index:true,required:true},
  created_at: {type:Date, default:Date.now},
  notes: String,
});

AdminSchema.method('validPassword',function(password){
  return bcrypt.compareSync(password,this.password);
});

AdminSchema.path('password').set(function(password){
  //加盐
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password,salt);
});


module.exports = mg.model('Admin',AdminSchema);
