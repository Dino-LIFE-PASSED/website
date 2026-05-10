const express = require("express")
const path = require("path")
const fs = require("fs")

const app = express()
const PORT = 4000

app.use(express.static(path.join(__dirname, "public")))

app.get("/api/logos", (req, res) => {
  const dir = path.join(__dirname, "public/svg")
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".svg") || f.endsWith(".png"))
  res.json(files)
  console.log(files)
})

app.listen(PORT, () => {
  console.log(`Partners test server running at http://localhost:${PORT}/views/partners-test.html`)
})
