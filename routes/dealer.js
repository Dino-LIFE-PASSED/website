const express = require('express')
const router  = express.Router()
const bcrypt  = require('bcrypt')
const db      = require('../db')
const { requireDealer } = require('../middleware/auth')

router.get('/', (req, res) => res.redirect('/dealer/login'))

router.get('/login', (req, res) => {
  if (req.session.dealerId) return res.redirect('/dealer/prices')
  res.render('dealer/login', { error: null })
})

router.post('/login', async (req, res) => {
  const code     = (req.body.code || '').trim().toUpperCase()
  const password = req.body.password || ''
  try {
    const dealer = await db.getDealerByCode(code)
    if (!dealer || !(await bcrypt.compare(password, dealer.password_hash))) {
      return res.render('dealer/login', { error: 'invalid dealer code or password' })
    }
    req.session.dealerId       = dealer.id
    req.session.dealerCode     = dealer.code
    req.session.dealerName     = dealer.name
    req.session.dealerDiscount = parseFloat(dealer.discount_percent)
    res.redirect('/dealer/prices')
  } catch (err) {
    console.error(err)
    res.render('dealer/login', { error: 'server error — please try again' })
  }
})

router.get('/logout', (req, res) => {
  req.session = null
  res.redirect('/dealer/login')
})

router.get('/prices', requireDealer, async (req, res) => {
  const products = await db.getAllProducts()
  res.render('dealer/prices', {
    products,
    discount:   req.session.dealerDiscount,
    dealerName: req.session.dealerName,
    dealerCode: req.session.dealerCode,
  })
})

router.get('/prices/export.csv', requireDealer, async (req, res) => {
  const products = await db.getAllProducts()
  const discount = req.session.dealerDiscount
  const rows = [
    ['Product', 'List Price (THB)', `Discount (${discount}%)`, 'Dealer Price (THB)'],
    ...products.map(p => {
      const dealerPrice = (p.price * (1 - discount / 100)).toFixed(2)
      return [p.name, Number(p.price).toFixed(2), `-${discount}%`, dealerPrice]
    })
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="PAG-dealer-${req.session.dealerCode}-prices.csv"`)
  res.send('﻿' + csv)
})

module.exports = router
