const express = require('express')
const rateLimit = require('express-rate-limit')
const path = require('path')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const svgCaptcha = require('svg-captcha')
const app = express()

/*
  Rate-Limiting
*/
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Spezifischer:
// app.use('/api/', limiter)
app.use('/secure/', limiter)

/*
  Server Setup
*/
// Session Middleware
app.use(session({
  secret: 'keyboard cat',
}))

// Bodybarser Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static Routes get served automatically
app.use(express.static('public'))

// Set EJS as view engine
app.set('view engine', 'ejs')

// Whitelist Middleware
app.use((req, res, next) => {
  const ip = req.socket.remoteAddress;

  // Only allow whitelisted access
  if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
    next();
  } else {
    // Deny Access
    console.log(`Unauthorized Access by IP: ${ip}`)
    res.status(403).send('Not whitelisted')
  }
})

// Cookie Authentication Middleware
app.use(cookieParser());
app.use('/secure/', (req, res, next) => {
  // If cookie is set...
  if (req.cookies.userToken) {
    // ... use the regular routes
    next();
  } else {
    // ... else redirect the user back home
    res.redirect('/')
  }
})


/*
  Home
*/

app.get('/', (req, res) => {
  // neues Captcha wird generiert
  const captcha = svgCaptcha.create()

  // Captcha-Lösungstext wird in Session gespeichert
  req.session.captcha = captcha.text

  res.render(path.join(__dirname, '/view/home'), { captcha: captcha.data, cookie: req.cookies.userToken })
})




/* 
  Cookie Subroutes
*/
app.post('/getCookie', (req, res) => {
  // Vergleich Daten von Server === Eingabe von Nutzer
  if (req.session.captcha === req.body.captcha) {
    res.cookie('userToken', 'amazingTokenContent')
    res.redirect('/')
    // get
  } else {
    res.redirect('/')
  }
})

app.get('/invalidateCookie', (req, res) => {
  res.clearCookie('userToken')
  res.redirect('/')
})

/*
  Secure Routes
*/

app.get('/secure/', (req, res) => {
  res.sendFile(path.join(__dirname + '/view/secureIndex.html'))
})

app.get('/secure/purchaseForm', (req, res) => {
  // neues Captcha wird generiert
  const captcha = svgCaptcha.create()

  // Captcha-Lösungstext wird in Session gespeichert
  req.session.captcha = captcha.text

  // Captcha-SVG wird im Template eingefügt
  res.render(path.join(__dirname, '/view/securePurchaseForm'), { captcha: captcha.data })
})

app.post('/secure/purchaseConfirmation', (req, res) => {
  // Vergleich Daten von Server === Eingabe von Nutzer
  if (req.session.captcha === req.body.captcha) {
    res.sendFile(path.join(__dirname + '/view/secureSuccess.html'))
  } else {
    res.sendFile(path.join(__dirname + '/view/secureDenied.html'))
  }
})

/*
  Insecure Routes
*/

app.get('/insecure/', (req, res) => {
  res.sendFile(path.join(__dirname + '/view/insecureIndex.html'))
})


app.get('/insecure/purchaseForm', (req, res) => {
  // Captcha-SVG wird im Template eingefügt
  res.sendFile(path.join(__dirname + '/view/insecurePurchaseForm.html'))
})

app.post('/insecure/purchaseConfirmation', (req, res) => {
  res.sendFile(path.join(__dirname + '/view/insecureSuccess.html'))
})


/*
  Start Server
*/

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})