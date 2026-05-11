CREATE TABLE IF NOT EXISTS products (
  id      SERIAL PRIMARY KEY,
  slug    TEXT UNIQUE NOT NULL,
  name    TEXT NOT NULL,
  badge   TEXT,
  price   NUMERIC(10, 2) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS product_images (
  id          SERIAL PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_inputs (
  id          SERIAL PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  count       INT NOT NULL DEFAULT 1,
  icon        TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_outputs (
  id          SERIAL PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  count       INT NOT NULL DEFAULT 1,
  icon        TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_specs (
  id          SERIAL PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  value       TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);
