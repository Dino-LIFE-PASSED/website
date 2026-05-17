function requireDealer(req, res, next) {
  if (req.session.dealerId) return next()
  res.redirect('/dealer/login')
}

module.exports = { requireDealer }
