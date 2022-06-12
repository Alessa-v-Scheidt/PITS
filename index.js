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
app.use(limiter)

/*
  Server Setup
*/
app.use(session({
  secret: 'keyboard cat',
}))
app.use(express.json())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/index.html'))
})

app.get('/purchaseForm', (req, res) => {
  // neues Captcha wird generiert
  const captcha = svgCaptcha.create()

  // Captcha-Lösungstext wird in Session gespeichert
  req.session.captcha = captcha.text

  // Captcha-SVG wird im Template eingefügt
  res.render(path.join(__dirname + '/public/purchaseForm'), { captcha: captcha.data})
})

app.post('/purchaseConfirmation', (req, res) => {
  // Vergleich Daten von Server === Eingabe von Nutzer
  if(req.session.captcha === req.body.captcha){
    res.send('Success')
  } else {
    res.send('Denied!')
  } 
})

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
})