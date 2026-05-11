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

module.exports = { pool, getProductBySlug, getAllProducts }
