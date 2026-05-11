require('dotenv').config()
const express = require("express")
const path = require("path")
const fs = require("fs")

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

const productData = {
  'pag-x1-monitor': {
    name: 'PAG-X1 Monitor',
    badge: 'featured',
    price: 299,
    desc: 'Reference-grade studio monitor engineered for flat frequency response and zero coloration. Built for mixing and mastering engineers who need the truth — no flattery, no distortion.',
    inputs: [
      { name: 'XLR Balanced', count: 2, icon: 'svgviewer-output.svg' },
      { name: 'TRS 1/4"',     count: 1, icon: 'svgviewer-output-2.svg' },
      { name: 'RCA',          count: 1, icon: 'svgviewer-output-3.svg' },
    ],
    outputs: [
      { name: 'Speaker Driver',  count: 2, icon: 'svgviewer-output-4.svg' },
      { name: 'Headphone 1/4"', count: 1, icon: 'svgviewer-output-5.svg' },
      { name: 'Sub Out',         count: 1, icon: 'svgviewer-output-6.svg' },
    ],
    specs: [
      { label: 'Frequency Response', value: '45Hz – 20kHz' },
      { label: 'Driver',             value: '5" woofer + 1" tweeter' },
      { label: 'Impedance',          value: '8 Ω' },
      { label: 'Max SPL',            value: '105 dB' },
      { label: 'Weight',             value: '6.5 kg' },
      { label: 'Dimensions',         value: '200 × 280 × 240 mm' },
      { label: 'Power',              value: '60W RMS' },
      { label: 'Warranty',           value: '2 years' },
    ]
  }
}

app.get("/products/:slug", (req, res) => {
  const product = productData[req.params.slug]
  if (!product) return res.status(404).send('Product not found')
  res.render("product-detail", { product })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})