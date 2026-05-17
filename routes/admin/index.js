const express = require('express')
const router  = express.Router()
const path    = require('path')
const multer  = require('multer')
const db      = require('../../db')

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../public/images/product_images'),
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname)
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase()
      cb(null, `${base}-${Date.now()}${ext}`)
    }
  })
})

router.get('/',              (req, res) => res.render('admin/index'))
router.post('/upload',       upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' })
  res.json({ path: `/images/product_images/${req.file.filename}` })
})
router.get('/api/io-names',  async (req, res) => {
  const data = await db.getDistinctIONames()
  res.json(data)
})

router.use(require('./products'))
router.use(require('./events'))
router.use(require('./partners'))
router.use(require('./dealers'))

module.exports = router
