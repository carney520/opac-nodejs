var mg = require('mongoose'),
  Schema = mg.Schema,
  bcrypt = require('bcryptjs')

var readerSchema = new Schema({
  name: { type: String, required: true, index: true },
  /*社会性功能*/
  signature: String,
  introduce: String,
  tags: { type: [String] }, //用户收藏过的标签
  card_no: { type: String, required: true, unique: true },
  avatar: String,
  email: { type: String, index: true },
  status: {
    type: String,
    default: 'normal',
    enum: ['normal', 'overdue', 'logout'],
  },
  tel: String,
  mobile: String,
  notes: String,
  created_at: { type: Date, default: Date.now },
  amount: { type: Number, default: 0 },
  password: { type: String, required: true },
})
//虚拟属性
readerSchema.virtual('role').get(function() {
  return 'reader'
})

readerSchema.method('validPassword', function(password) {
  return bcrypt.compareSync(password, this.password)
})

readerSchema.path('password').set(function(password) {
  var salt = bcrypt.genSaltSync(10)
  return bcrypt.hashSync(password, salt)
})

module.exports = mg.model('Reader', readerSchema)
