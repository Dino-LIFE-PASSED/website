require('dotenv').config()
const express     = require('express')
const path        = require('path')
const cookieSession = require('cookie-session')
const app         = express()
const PORT        = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'public/views'))

app.use(cookieSession({
  name: 'dealer',
  keys: [process.env.SESSION_SECRET || 'pag-dealer-secret-key'],
  maxAge: 30 * 24 * 60 * 60 * 1000,
}))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api',    require('./routes/api'))
app.use('/admin',  require('./routes/admin/index'))
app.use('/dealer', require('./routes/dealer'))
app.use('/',       require('./routes/public'))

app.listen(PORT, '::', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
