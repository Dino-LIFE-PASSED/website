require('dotenv').config()
const express = require("express")
const path = require("path")
const fs = require("fs")
const db = require("./db")

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

app.get("/", (req, res) => {
  res.render("home")
})

app.get("/products", (req, res) => {
  res.render("products")
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})