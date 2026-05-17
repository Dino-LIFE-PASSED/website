const express = require('express')
const router  = express.Router()
const db      = require('../db')

router.get('/preview/shapes-bg', (req, res) => res.render('preview/shapes-bg'))

router.get('/', async (req, res) => {
  const [products, events] = await Promise.all([db.getAllProducts(), db.getUpcomingEvents()])
  res.render('home', { products, events })
})

router.get('/products', async (req, res) => {
  const products = await db.getAllProducts()
  res.render('products', { products })
})

router.get('/products/:slug', async (req, res) => {
  try {
    const product = await db.getProductBySlug(req.params.slug)
    if (!product) return res.status(404).send('Product not found')
    res.render('product-detail', { product })
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

module.exports = router
