const express = require('express')
const rateLimit = require('express-rate-limit')
const path = require('path')
const session = require('express-session')
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
app.use('/store/', limiter)

/*
  Server Setup
*/
app.use(session({
  secret: 'keyboard cat',
}))
app.use(express.json())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'ejs')

/*
  Secure Routes
*/

app.get('/', (req, res) => {
  res.redirect('/secure/')
})

app.get('/secure/', (req, res) => {
  res.sendFile(path.join(__dirname + '/view/secureIndex.html'))
})


app.get('/secure/purchaseForm', (req, res) => {
  // neues Captcha wird generiert
  const captcha = svgCaptcha.create()

  // Captcha-Lösungstext wird in Session gespeichert
  req.session.captcha = captcha.text

  // Captcha-SVG wird im Template eingefügt
  res.render(path.join(__dirname + '/view/securePurchaseForm'), { captcha: captcha.data })
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
  Unsecured Routes
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


app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})