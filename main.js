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

app.get("/dark", (req, res) => {
  res.render("index-dark")
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})