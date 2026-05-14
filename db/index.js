const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function initSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  await pool.query(sql)
}

initSchema().catch(err => console.error('Schema init failed:', err.message))

async function getProductBySlug(slug) {
  const { rows: products } = await pool.query(
    'SELECT id, slug, name, badge, price, description, stock FROM products WHERE slug = $1',
    [slug]
  )
  if (!products.length) return null

  const product = products[0]
  const id = product.id

  const [images, inputs, outputs, specs] = await Promise.all([
    pool.query('SELECT path FROM product_images  WHERE product_id = $1 ORDER BY sort_order', [id]),
    pool.query('SELECT name, count, icon FROM product_inputs  WHERE product_id = $1 ORDER BY sort_order', [id]),
    pool.query('SELECT name, count, icon FROM product_outputs WHERE product_id = $1 ORDER BY sort_order', [id]),
    pool.query('SELECT label, value       FROM product_specs   WHERE product_id = $1 ORDER BY sort_order', [id]),
  ])

  return {
    name:    product.name,
    badge:   product.badge,
    price:   product.price,
    desc:    product.description,
    stock:   product.stock,
    images:  images.rows.map(r => r.path),
    inputs:  inputs.rows,
    outputs: outputs.rows,
    specs:   specs.rows,
  }
}

async function getAllProducts() {
  const { rows } = await pool.query(`
    SELECT p.slug, p.name, p.badge, p.price, p.description, p.stock,
      (SELECT path FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image
    FROM products p
    ORDER BY p.id
  `)
  return rows
}

async function createProduct(data) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      'INSERT INTO products (slug, name, badge, price, description, stock) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [data.slug, data.name, data.badge || null, data.price, data.desc, data.stock ?? 0]
    )
    const id = rows[0].id
    await _insertRelated(client, id, data)
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

async function updateProduct(slug, data) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      'UPDATE products SET name=$1, badge=$2, price=$3, description=$4, slug=$5, stock=$6 WHERE slug=$7 RETURNING id',
      [data.name, data.badge || null, data.price, data.desc, data.slug, data.stock ?? 0, slug]
    )
    if (!rows.length) throw new Error('Product not found')
    const id = rows[0].id
    await client.query('DELETE FROM product_images  WHERE product_id=$1', [id])
    await client.query('DELETE FROM product_inputs  WHERE product_id=$1', [id])
    await client.query('DELETE FROM product_outputs WHERE product_id=$1', [id])
    await client.query('DELETE FROM product_specs   WHERE product_id=$1', [id])
    await _insertRelated(client, id, data)
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

async function _insertRelated(client, id, data) {
  for (let i = 0; i < data.images.length; i++)
    await client.query('INSERT INTO product_images (product_id, path, sort_order) VALUES ($1,$2,$3)',
      [id, data.images[i], i])

  for (let i = 0; i < data.inputs.length; i++)
    await client.query('INSERT INTO product_inputs (product_id, name, count, icon, sort_order) VALUES ($1,$2,$3,$4,$5)',
      [id, data.inputs[i].name, data.inputs[i].count, data.inputs[i].icon, i])

  for (let i = 0; i < data.outputs.length; i++)
    await client.query('INSERT INTO product_outputs (product_id, name, count, icon, sort_order) VALUES ($1,$2,$3,$4,$5)',
      [id, data.outputs[i].name, data.outputs[i].count, data.outputs[i].icon, i])

  for (let i = 0; i < data.specs.length; i++)
    await client.query('INSERT INTO product_specs (product_id, label, value, sort_order) VALUES ($1,$2,$3,$4)',
      [id, data.specs[i].label, data.specs[i].value, i])
}

async function getDistinctIONames() {
  const [inputs, outputs] = await Promise.all([
    pool.query('SELECT DISTINCT name FROM product_inputs  ORDER BY name'),
    pool.query('SELECT DISTINCT name FROM product_outputs ORDER BY name'),
  ])
  return {
    inputNames:  inputs.rows.map(r => r.name),
    outputNames: outputs.rows.map(r => r.name),
  }
}

async function deleteProduct(slug) {
  const { rowCount } = await pool.query('DELETE FROM products WHERE slug = $1', [slug])
  if (!rowCount) throw new Error('Product not found')
}

async function getDealerByCode(code) {
  const { rows } = await pool.query('SELECT * FROM dealers WHERE code = $1', [code])
  return rows[0] || null
}

async function getAllDealers() {
  const { rows } = await pool.query('SELECT id, code, name, discount_percent FROM dealers ORDER BY id')
  return rows
}

async function createDealer({ code, name, passwordHash, discount }) {
  const { rows } = await pool.query(
    'INSERT INTO dealers (code, name, password_hash, discount_percent) VALUES ($1,$2,$3,$4) RETURNING id',
    [code, name, passwordHash, discount]
  )
  return rows[0]
}

async function updateDealer(id, { name, discount }) {
  const { rowCount } = await pool.query(
    'UPDATE dealers SET name=$1, discount_percent=$2 WHERE id=$3',
    [name, discount, id]
  )
  if (!rowCount) throw new Error('Dealer not found')
}

async function updateDealerPassword(id, passwordHash) {
  const { rowCount } = await pool.query('UPDATE dealers SET password_hash=$1 WHERE id=$2', [passwordHash, id])
  if (!rowCount) throw new Error('Dealer not found')
}

async function deleteDealer(id) {
  const { rowCount } = await pool.query('DELETE FROM dealers WHERE id=$1', [id])
  if (!rowCount) throw new Error('Dealer not found')
}

async function updateProductBasic(slug, { name, badge, price, stock, desc }) {
  const { rowCount } = await pool.query(
    'UPDATE products SET name=$1, badge=$2, price=$3, description=$4, stock=$5 WHERE slug=$6',
    [name, badge || null, price, desc, stock ?? 0, slug]
  )
  if (!rowCount) throw new Error('Product not found')
}

module.exports = {
  pool, getProductBySlug, getAllProducts, createProduct, updateProduct, updateProductBasic,
  deleteProduct, getDistinctIONames,
  getDealerByCode, getAllDealers, createDealer, updateDealer, updateDealerPassword, deleteDealer,
}
