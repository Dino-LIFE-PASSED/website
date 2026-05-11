const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function getProductBySlug(slug) {
  const { rows: products } = await pool.query(
    'SELECT id, slug, name, badge, price, description FROM products WHERE slug = $1',
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
    images:  images.rows.map(r => r.path),
    inputs:  inputs.rows,
    outputs: outputs.rows,
    specs:   specs.rows,
  }
}

async function getAllProducts() {
  const { rows } = await pool.query('SELECT slug, name, badge, price, description FROM products ORDER BY id')
  return rows
}

async function createProduct(data) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      'INSERT INTO products (slug, name, badge, price, description) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [data.slug, data.name, data.badge || null, data.price, data.desc]
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
      'UPDATE products SET name=$1, badge=$2, price=$3, description=$4, slug=$5 WHERE slug=$6 RETURNING id',
      [data.name, data.badge || null, data.price, data.desc, data.slug, slug]
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

module.exports = { pool, getProductBySlug, getAllProducts, createProduct, updateProduct, getDistinctIONames }
