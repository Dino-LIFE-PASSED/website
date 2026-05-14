require('dotenv').config()
const express = require("express")
const path = require("path")
const fs = require("fs")
const multer = require("multer")
const cookieSession = require("cookie-session")
const bcrypt = require("bcrypt")
const db = require("./db")
const app = express()
const PORT = process.env.PORT || 3000

const PARTNERS_FILE = path.join(__dirname, "data/partners.json")
function readPartners() {
  try { return JSON.parse(fs.readFileSync(PARTNERS_FILE, "utf8")) } catch { return {} }
}
function writePartners(data) {
  fs.writeFileSync(PARTNERS_FILE, JSON.stringify(data, null, 2))
}

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: path.join(__dirname, "public/images/product_images"),
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname)
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase()
      cb(null, `${base}-${Date.now()}${ext}`)
    }
  })
})

const logoUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: path.join(__dirname, "public/svg"),
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase()
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase()
      cb(null, `${base}-${Date.now()}${ext}`)
    }
  }),
  fileFilter: (req, file, cb) => {
    const ok = ['.svg', '.png'].includes(path.extname(file.originalname).toLowerCase())
    cb(null, ok)
  }
})


app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "public/views"))

app.use(cookieSession({
  name: 'dealer',
  keys: [process.env.SESSION_SECRET || 'pag-dealer-secret-key'],
  maxAge: 30 * 24 * 60 * 60 * 1000,
}))

app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

function requireDealer(req, res, next) {
  if (req.session.dealerId) return next()
  res.redirect('/dealer/login')
}

app.get("/api/logos", (req, res) => {
  const dir = path.join(__dirname, "public/svg")
  const files = fs.readdirSync(dir).filter(f => /\.(svg|png)$/i.test(f)).sort()
  const urls = readPartners()
  res.json(files.map(file => ({ file, url: urls[file] || "" })))
})

app.get("/", async (req, res) => {
  const products = await db.getAllProducts()
  res.render("home", { products })
})

app.get("/products", async (req, res) => {
  const products = await db.getAllProducts()
  res.render("products", { products })
})

app.get("/products/:slug", async (req, res) => {
  try {
    const product = await db.getProductBySlug(req.params.slug)
    if (!product) return res.status(404).send('Product not found')
    res.render("product-detail", { product })
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

function parseProductForm(body) {
  const images  = [].concat(body.images       || []).filter(Boolean)
  const inNames = [].concat(body.input_name   || [])
  const inCounts= [].concat(body.input_count  || [])
  const inIcons = [].concat(body.input_icon   || [])
  const outNames= [].concat(body.output_name  || [])
  const outCounts=[].concat(body.output_count || [])
  const outIcons= [].concat(body.output_icon  || [])
  const spLabels= [].concat(body.spec_label   || [])
  const spValues= [].concat(body.spec_value   || [])

  return {
    slug:    body.slug?.trim(),
    name:    body.name?.trim(),
    badge:   body.badge?.trim() || null,
    price:   parseFloat(body.price),
    stock:   parseInt(body.stock) || 0,
    desc:    body.desc?.trim(),
    images,
    inputs:  inNames.map((n, i) => ({ name: n, count: parseInt(inCounts[i]) || 1, icon: inIcons[i] })).filter(r => r.name),
    outputs: outNames.map((n, i) => ({ name: n, count: parseInt(outCounts[i]) || 1, icon: outIcons[i] })).filter(r => r.name),
    specs:   spLabels.map((l, i) => ({ label: l, value: spValues[i] })).filter(r => r.label),
  }
}

app.post("/admin/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file received" })
  res.json({ path: `/images/product_images/${req.file.filename}` })
})

app.get("/admin/api/io-names", async (req, res) => {
  const data = await db.getDistinctIONames()
  res.json(data)
})

app.get("/admin", (req, res) => {
  res.render("admin/index")
})

app.get("/admin/partners", (req, res) => {
  const dir = path.join(__dirname, "public/svg")
  const files = fs.readdirSync(dir).filter(f => /\.(svg|png)$/i.test(f)).sort()
  const urls = readPartners()
  const logos = files.map(file => ({ file, url: urls[file] || "" }))
  res.render("admin/partners", { logos })
})

app.post("/admin/partners/upload", logoUpload.single("logo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file received" })
  res.json({ ok: true, filename: req.file.filename })
})

app.post("/admin/partners/:filename/url", (req, res) => {
  const filename = path.basename(req.params.filename)
  let url = (req.body.url || "").trim()
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`
  const data = readPartners()
  if (url) { data[filename] = url } else { delete data[filename] }
  writePartners(data)
  res.json({ ok: true, url })
})

app.delete("/admin/partners/:filename", (req, res) => {
  const filename = path.basename(req.params.filename)
  const filepath = path.join(__dirname, "public/svg", filename)
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: "File not found" })
  fs.unlinkSync(filepath)
  const data = readPartners()
  delete data[filename]
  writePartners(data)
  res.json({ ok: true })
})

app.get("/admin/products", async (req, res) => {
  const products = await db.getAllProducts()
  res.render("admin/products", { products })
})

app.delete("/admin/products/:slug", async (req, res) => {
  try {
    await db.deleteProduct(req.params.slug)
    res.json({ ok: true })
  } catch (err) {
    res.status(404).json({ error: err.message })
  }
})

app.get("/admin/product_edit", (req, res) => {
  res.render("admin/product_edit", { product: null, flash: null })
})

app.get("/admin/product_edit/:slug", async (req, res) => {
  try {
    const product = await db.getProductBySlug(req.params.slug)
    if (!product) return res.status(404).send('Product not found')
    product.slug = req.params.slug
    const flash = req.query.saved   ? { type: 'success', message: 'Product saved.' }
                : req.query.created ? { type: 'success', message: 'Product created.' }
                : null
    res.render("admin/product_edit", { product, flash })
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

app.post("/admin/product_edit", async (req, res) => {
  try {
    const data = parseProductForm(req.body)
    await db.createProduct(data)
    res.redirect(`/admin/product_edit/${data.slug}?created=1`)
  } catch (err) {
    console.error(err)
    const product = null
    res.render("admin/product_edit", { product, flash: { type: 'error', message: err.message } })
  }
})

app.post("/admin/product_edit/:slug", async (req, res) => {
  try {
    const data = parseProductForm(req.body)
    console.log('[save]', req.params.slug, 'images:', data.images)
    await db.updateProduct(req.params.slug, data)
    res.redirect(`/admin/product_edit/${data.slug}?saved=1`)
  } catch (err) {
    console.error(err)
    const product = await db.getProductBySlug(req.params.slug).catch(() => null)
    if (product) product.slug = req.params.slug
    res.render("admin/product_edit", { product, flash: { type: 'error', message: err.message } })
  }
})

/* ── Dealer portal ── */
app.get("/dealer", (req, res) => {
  res.redirect('/dealer/login')
})

app.get("/dealer/login", (req, res) => {
  if (req.session.dealerId) return res.redirect('/dealer/prices')
  res.render("dealer/login", { error: null })
})

app.post("/dealer/login", async (req, res) => {
  const code = (req.body.code || '').trim().toUpperCase()
  const password = req.body.password || ''
  try {
    const dealer = await db.getDealerByCode(code)
    if (!dealer || !(await bcrypt.compare(password, dealer.password_hash))) {
      return res.render("dealer/login", { error: 'invalid dealer code or password' })
    }
    req.session.dealerId = dealer.id
    req.session.dealerCode = dealer.code
    req.session.dealerName = dealer.name
    req.session.dealerDiscount = parseFloat(dealer.discount_percent)
    res.redirect('/dealer/prices')
  } catch (err) {
    console.error(err)
    res.render("dealer/login", { error: 'server error — please try again' })
  }
})

app.get("/dealer/logout", (req, res) => {
  req.session = null
  res.redirect('/dealer/login')
})

app.get("/dealer/prices", requireDealer, async (req, res) => {
  const products = await db.getAllProducts()
  const discount = req.session.dealerDiscount
  res.render("dealer/prices", {
    products,
    discount,
    dealerName: req.session.dealerName,
    dealerCode: req.session.dealerCode,
  })
})

app.get("/dealer/prices/export.csv", requireDealer, async (req, res) => {
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

/* ── Admin: dealers ── */
app.get("/admin/dealers", async (req, res) => {
  const dealers = await db.getAllDealers()
  const flash = req.query.created ? { type: 'success', message: 'Dealer created.' } : null
  res.render("admin/dealers", { dealers, flash })
})

app.post("/admin/dealers", async (req, res) => {
  try {
    const code = (req.body.code || '').trim().toUpperCase()
    const name = (req.body.name || '').trim()
    const password = (req.body.password || '').trim()
    const discount = parseFloat(req.body.discount)
    if (!code || !name || !password) throw new Error('all fields required')
    if (isNaN(discount) || discount < 0 || discount > 100) throw new Error('discount must be 0–100')
    if (password.length < 4) throw new Error('password must be at least 4 characters')
    const passwordHash = await bcrypt.hash(password, 10)
    await db.createDealer({ code, name, passwordHash, discount })
    res.redirect('/admin/dealers?created=1')
  } catch (err) {
    const dealers = await db.getAllDealers()
    res.render("admin/dealers", { dealers, flash: { type: 'error', message: err.message } })
  }
})

app.post("/admin/dealers/:id/update", async (req, res) => {
  try {
    const name = (req.body.name || '').trim()
    const discount = parseFloat(req.body.discount)
    if (!name) throw new Error('name required')
    if (isNaN(discount) || discount < 0 || discount > 100) throw new Error('discount must be 0–100')
    await db.updateDealer(req.params.id, { name, discount })
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

app.post("/admin/dealers/:id/password", async (req, res) => {
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

app.delete("/admin/dealers/:id", async (req, res) => {
  try {
    await db.deleteDealer(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})