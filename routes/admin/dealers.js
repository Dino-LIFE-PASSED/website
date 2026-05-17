const express = require('express')
const router  = express.Router()
const bcrypt  = require('bcrypt')
const db      = require('../../db')

router.get('/dealers', async (req, res) => {
  const dealers = await db.getAllDealers()
  const flash   = req.query.created ? { type: 'success', message: 'Dealer created.' } : null
  res.render('admin/dealers', { dealers, flash })
})

router.post('/dealers', async (req, res) => {
  try {
    const code     = (req.body.code     || '').trim().toUpperCase()
    const name     = (req.body.name     || '').trim()
    const password = (req.body.password || '').trim()
    const discount = parseFloat(req.body.discount)
    if (!code || !name || !password)               throw new Error('all fields required')
    if (isNaN(discount) || discount < 0 || discount > 100) throw new Error('discount must be 0–100')
    if (password.length < 4)                       throw new Error('password must be at least 4 characters')
    const passwordHash = await bcrypt.hash(password, 10)
    await db.createDealer({ code, name, passwordHash, discount })
    res.redirect('/admin/dealers?created=1')
  } catch (err) {
    const dealers = await db.getAllDealers()
    res.render('admin/dealers', { dealers, flash: { type: 'error', message: err.message } })
  }
})

router.post('/dealers/:id/update', async (req, res) => {
  try {
    const name     = (req.body.name || '').trim()
    const discount = parseFloat(req.body.discount)
    if (!name) throw new Error('name required')
    if (isNaN(discount) || discount < 0 || discount > 100) throw new Error('discount must be 0–100')
    await db.updateDealer(req.params.id, { name, discount })
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

router.post('/dealers/:id/password', async (req, res) => {
  try {
    const password = (req.body.password || '').trim()
    if (password.length < 4) throw new Error('password must be at least 4 characters')
    const passwordHash = await bcrypt.hash(password, 10)
    await db.updateDealerPassword(req.params.id, passwordHash)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

router.delete('/dealers/:id', async (req, res) => {
  try {
    await db.deleteDealer(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

module.exports = router
