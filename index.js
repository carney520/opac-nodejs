var express = require('express'),
  path = require('path'),
  config = require('./config/env'),
  viewHelpers = require('./app/helpers/index'),
  routes = require('./config/route'),
  passport = require('./config/passport'),
  connectStrongParams = require('./middlewares/connect-strong-params'),
  connectAssets = require('connect-assets'),
  methodOverride = require('method-override'),
  morgan = require('morgan'),
  mongoose = require('mongoose'),
  errorHandler = require('errorhandler'),
  compression = require('compression'),
  cookieParser = require('cookie-parser'),
  flash = require('flash'),
  cookieSession = require('cookie-session'),
  multer = require('multer'),
  csurf = require('csurf'),
  bodyParser = require('body-parser')

var app = express()
//initial
config(app)
//set up view engine
app.set('views', path.join(__dirname, 'app/views'))
app.set('view engine', 'jade')

//log and errorhandler
if (app.get('env') === 'development') {
  app.use(morgan('dev'))
}

//set up compression
app.use(compression())

//set up public file service
app.use(express.static('./public'))

//set up assets service
app.use(
  connectAssets({
    paths: ['public/css', 'public/js', 'public/images'],
  })
)

//set up cookie parser
app.use(cookieParser(app.get('credentials').cookie))

//set up session
app.use(
  cookieSession({
    name: 'sess',
    keys: app.get('credentials').session,
  })
)

//set up body parser
//json
app.use(bodyParser.json())
//urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

app.use(multer({ dest: 'public/files' }).any())

//method override
//like 'path?_method=DELETE'
app.use(methodOverride('_method'))

//csrf 必须放在bodyparser后面
app.use(csurf())

passport(app)

//set up view helpers
viewHelpers(app)

//set up flash message
app.use(flash())

//set up strong parameters
app.use(connectStrongParams)
//connect mongodb
mongoose.connect(app.get('credentials').mongo.connectString, {
  server: {
    poolSize: 20,
    socketOptions: { keepAlive: 1 },
  },
})

//set up routes
routes(app)

//404
app.use(function(req, res, next) {
  res.status(404)
  res.format({
    json: function() {
      res.json({ code: '404', message: 'Resource not found' })
    },
    html: function() {
      res.render('404')
    },
  })
})

//error handler
app.use(function(err, req, res, next) {
  console.log(err)
  next(err)
})
app.use(errorHandler())
app.use(function(err, req, res, next) {
  res.status(500).send('500 Internal server error ')
  console.log(err)
})

app.listen(app.get('port'), function(err) {
  if (err) {
    console.log(err)
  } else {
    console.log(app.get('name') + ' was started in ' + app.get('port'))
  }
})
