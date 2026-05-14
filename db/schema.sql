CREATE TABLE IF NOT EXISTS products (
  id      SERIAL PRIMARY KEY,
  slug    TEXT UNIQUE NOT NULL,
  name    TEXT NOT NULL,
  badge   TEXT,
  price   NUMERIC(10, 2) NOT NULL,
  description TEXT,
  stock   INT NOT NULL DEFAULT 0
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

CREATE TABLE IF NOT EXISTS dealers (
  id               SERIAL PRIMARY KEY,
  code             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  password_hash    TEXT NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 20
);

CREATE TABLE IF NOT EXISTS events (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  event_date   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_images (
  id         SERIAL PRIMARY KEY,
  event_id   INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  path       TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
