const express  = require('express')
const router   = express.Router()
const path     = require('path')
const fs       = require('fs')
const multer   = require('multer')
const { readPartners, writePartners } = require('../../utils/partners')

const logoUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../public/svg'),
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

router.get('/partners', (req, res) => {
  const dir   = path.join(__dirname, '../../public/svg')
  const files = fs.readdirSync(dir).filter(f => /\.(svg|png)$/i.test(f)).sort()
  const urls  = readPartners()
  res.render('admin/partners', { logos: files.map(file => ({ file, url: urls[file] || '' })) })
})

router.post('/partners/upload', logoUpload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' })
  res.json({ ok: true, filename: req.file.filename })
})

router.post('/partners/:filename/url', (req, res) => {
  const filename = path.basename(req.params.filename)
  let url = (req.body.url || '').trim()
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`
  const data = readPartners()
  if (url) { data[filename] = url } else { delete data[filename] }
  writePartners(data)
  res.json({ ok: true, url })
})

router.delete('/partners/:filename', (req, res) => {
  const filename = path.basename(req.params.filename)
  const filepath = path.join(__dirname, '../../public/svg', filename)
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found' })
  fs.unlinkSync(filepath)
  const data = readPartners()
  delete data[filename]
  writePartners(data)
  res.json({ ok: true })
})

module.exports = router
