require('dotenv').config()
const express = require("express")
const path = require("path")
const fs = require("fs")
const multer = require("multer")
const db = require("./db")

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

const app = express()
const PORT = process.env.PORT || 3000

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "public/views"))

app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/api/logos", (req, res) => {
  const dir = path.join(__dirname, "public/svg")
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".svg") || f.endsWith(".png"))
  res.json(files)
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})