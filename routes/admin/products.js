const express  = require('express')
const router   = express.Router()
const multer   = require('multer')
const db       = require('../../db')
const { parseProductForm, parseCSV } = require('../../utils/parsers')

const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })

router.get('/products', async (req, res) => {
  const products = await db.getAllProducts()
  res.render('admin/products', { products })
})

router.delete('/products/:slug', async (req, res) => {
  try {
    await db.deleteProduct(req.params.slug)
    res.json({ ok: true })
  } catch (err) {
    res.status(404).json({ error: err.message })
  }
})

router.get('/products/csv-template', (req, res) => {
  const rows = [
    ['slug', 'name', 'badge', 'price', 'stock', 'description'],
    ['my-product-slug', 'My Product Name', 'featured', '9990', '10', 'Short product description'],
  ]
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\r\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="PAG-products-template.csv"')
  res.send('﻿' + csv)
})

router.post('/products/import', csvUpload.single('csv'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const text = req.file.buffer.toString('utf8').replace(/^﻿/, '')
  const rows = parseCSV(text)
  if (rows.length < 2) return res.json({ created: 0, updated: 0, skipped: 0, errors: [] })

  const headers = rows[0].map(h => h.toLowerCase().trim())
  for (const col of ['slug', 'name', 'price']) {
    if (!headers.includes(col)) return res.status(400).json({ error: `Missing required column: ${col}` })
  }

  const ci = h => headers.indexOf(h)
  let created = 0, updated = 0, skipped = 0
  const errors = []

  for (let i = 1; i < rows.length; i++) {
    const row   = rows[i]
    if (row.every(c => !c)) continue
    const slug  = row[ci('slug')]?.trim()
    const name  = row[ci('name')]?.trim()
    const price = parseFloat(row[ci('price')])
    if (!slug || !name || isNaN(price)) { skipped++; errors.push(`Row ${i + 1}: missing slug, name, or valid price`); continue }
    const badge = ci('badge') >= 0 ? (row[ci('badge')]?.trim() || null) : null
    const stock = ci('stock') >= 0 ? (parseInt(row[ci('stock')]) || 0) : 0
    const desc  = ci('description') >= 0 ? (row[ci('description')]?.trim() || '') : ''
    try {
      await db.updateProductBasic(slug, { name, badge, price, stock, desc }); updated++
    } catch (err) {
      if (err.message === 'Product not found') {
        try { await db.createProduct({ slug, name, badge, price, stock, desc, images: [], inputs: [], outputs: [], specs: [] }); created++ }
        catch (e) { skipped++; errors.push(`Row ${i + 1} (${slug}): ${e.message}`) }
      } else { skipped++; errors.push(`Row ${i + 1} (${slug}): ${err.message}`) }
    }
  }
  res.json({ created, updated, skipped, errors })
})

router.get('/product_edit', (req, res) => {
  res.render('admin/product_edit', { product: null, flash: null })
})

router.get('/product_edit/:slug', async (req, res) => {
  try {
    const product = await db.getProductBySlug(req.params.slug)
    if (!product) return res.status(404).send('Product not found')
    product.slug = req.params.slug
    const flash = req.query.saved   ? { type: 'success', message: 'Product saved.' }
                : req.query.created ? { type: 'success', message: 'Product created.' }
                : null
    res.render('admin/product_edit', { product, flash })
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

router.post('/product_edit', async (req, res) => {
  try {
    const data = parseProductForm(req.body)
    await db.createProduct(data)
    res.redirect(`/admin/product_edit/${data.slug}?created=1`)
  } catch (err) {
    console.error(err)
    res.render('admin/product_edit', { product: null, flash: { type: 'error', message: err.message } })
  }
})

router.post('/product_edit/:slug', async (req, res) => {
  try {
    const data = parseProductForm(req.body)
    console.log('[save]', req.params.slug, 'images:', data.images)
    await db.updateProduct(req.params.slug, data)
    res.redirect(`/admin/product_edit/${data.slug}?saved=1`)
  } catch (err) {
    console.error(err)
    const product = await db.getProductBySlug(req.params.slug).catch(() => null)
    if (product) product.slug = req.params.slug
    res.render('admin/product_edit', { product, flash: { type: 'error', message: err.message } })
  }
})

module.exports = router
