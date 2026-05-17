const express = require('express')
const router  = express.Router()
const path    = require('path')
const fs      = require('fs')
const { readPartners } = require('../utils/partners')

router.get('/logos', (req, res) => {
  const dir   = path.join(__dirname, '../public/svg')
  const files = fs.readdirSync(dir).filter(f => /\.(svg|png)$/i.test(f)).sort()
  const urls  = readPartners()
  res.json(files.map(file => ({ file, url: urls[file] || '' })))
})

module.exports = router
