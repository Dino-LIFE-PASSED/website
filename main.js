require('dotenv').config()
const express = require("express")
const path = require("path")

const app = express()
const PORT = process.env.PORT || 3000

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "public/views"))

app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (req, res) => {
  res.render("home")
})

app.get("/dark", (req, res) => {
  res.render("index-dark")
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})