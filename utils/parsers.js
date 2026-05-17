function parseProductForm(body) {
  const images   = [].concat(body.images       || []).filter(Boolean)
  const inNames  = [].concat(body.input_name   || [])
  const inCounts = [].concat(body.input_count  || [])
  const inIcons  = [].concat(body.input_icon   || [])
  const outNames = [].concat(body.output_name  || [])
  const outCounts= [].concat(body.output_count || [])
  const outIcons = [].concat(body.output_icon  || [])
  const spLabels = [].concat(body.spec_label   || [])
  const spValues = [].concat(body.spec_value   || [])
  return {
    slug:    body.slug?.trim(),
    name:    body.name?.trim(),
    badge:   body.badge?.trim() || null,
    price:   parseFloat(body.price),
    stock:   parseInt(body.stock) || 0,
    desc:    body.desc?.trim(),
    images,
    inputs:  inNames.map((n, i) => ({ name: n, count: parseInt(inCounts[i]) || 1, icon: inIcons[i] })).filter(r => r.name),
    outputs: outNames.map((n, i) => ({ name: n, count: parseInt(outCounts[i]) || 1, icon: outIcons[i] })).filter(r => r.name),
    specs:   spLabels.map((l, i) => ({ label: l, value: spValues[i] })).filter(r => r.label),
  }
}

function parseEventForm(body) {
  const images      = [].concat(body.images || []).filter(Boolean)
  const name        = body.name?.trim()
  const description = body.description?.trim() || null
  const price       = parseFloat(body.price) || 0
  const event_date  = body.event_date
  if (!name)       throw new Error('Name is required')
  if (!event_date) throw new Error('Date is required')
  return { name, description, price, event_date, images }
}

function parseCSV(text) {
  const result = []
  const lines  = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const row = []
    let i = 0
    while (i < line.length) {
      if (line[i] === '"') {
        let field = ''
        i++
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2 }
          else if (line[i] === '"') { i++; break }
          else { field += line[i++] }
        }
        row.push(field)
        if (line[i] === ',') i++
      } else {
        let field = ''
        while (i < line.length && line[i] !== ',') field += line[i++]
        if (line[i] === ',') i++
        row.push(field.trim())
      }
    }
    result.push(row)
  }
  return result
}

module.exports = { parseProductForm, parseEventForm, parseCSV }
