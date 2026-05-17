const express = require('express')
const router  = express.Router()
const db      = require('../../db')
const { parseEventForm } = require('../../utils/parsers')

router.get('/events', async (req, res) => {
  const events = await db.getAllEvents()
  const flash  = req.query.created ? { type: 'success', message: 'Event created.' } : null
  res.render('admin/events', { events, flash })
})

router.delete('/events/:id', async (req, res) => {
  try {
    await db.deleteEvent(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(404).json({ error: err.message })
  }
})

router.get('/event_edit', (req, res) => {
  res.render('admin/event_edit', { event: null, flash: null })
})

router.get('/event_edit/:id', async (req, res) => {
  try {
    const event = await db.getEventById(req.params.id)
    if (!event) return res.status(404).send('Event not found')
    const flash = req.query.saved   ? { type: 'success', message: 'Event saved.' }
                : req.query.created ? { type: 'success', message: 'Event created.' }
                : null
    res.render('admin/event_edit', { event, flash })
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

router.post('/event_edit', async (req, res) => {
  try {
    const data = parseEventForm(req.body)
    const id   = await db.createEvent(data)
    res.redirect(`/admin/event_edit/${id}?created=1`)
  } catch (err) {
    console.error(err)
    res.render('admin/event_edit', { event: null, flash: { type: 'error', message: err.message } })
  }
})

router.post('/event_edit/:id', async (req, res) => {
  try {
    const data = parseEventForm(req.body)
    await db.updateEvent(req.params.id, data)
    res.redirect(`/admin/event_edit/${req.params.id}?saved=1`)
  } catch (err) {
    console.error(err)
    const event = await db.getEventById(req.params.id).catch(() => null)
    res.render('admin/event_edit', { event, flash: { type: 'error', message: err.message } })
  }
})

module.exports = router
