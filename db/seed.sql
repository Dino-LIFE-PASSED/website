INSERT INTO products (slug, name, badge, price, description) VALUES (
  'pag-x1-monitor',
  'PAG-X1 Monitor',
  'featured',
  299.00,
  'Reference-grade studio monitor engineered for flat frequency response and zero coloration. Built for mixing and mastering engineers who need the truth — no flattery, no distortion.'
) ON CONFLICT (slug) DO NOTHING;

-- Images
INSERT INTO product_images (product_id, path, sort_order)
SELECT id, '/images/pag-x1-front.jpg',  0 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;
INSERT INTO product_images (product_id, path, sort_order)
SELECT id, '/images/pag-x1-side.jpg',   1 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;
INSERT INTO product_images (product_id, path, sort_order)
SELECT id, '/images/pag-x1-back.jpg',   2 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;
INSERT INTO product_images (product_id, path, sort_order)
SELECT id, '/images/pag-x1-detail.jpg', 3 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;

-- Inputs
INSERT INTO product_inputs (product_id, name, count, icon, sort_order)
SELECT id, 'XLR Balanced', 2, 'svgviewer-output.svg',   0 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;
INSERT INTO product_inputs (product_id, name, count, icon, sort_order)
SELECT id, 'TRS 1/4"',     1, 'svgviewer-output-2.svg', 1 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;
INSERT INTO product_inputs (product_id, name, count, icon, sort_order)
SELECT id, 'RCA',          1, 'svgviewer-output-3.svg', 2 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;

-- Outputs
INSERT INTO product_outputs (product_id, name, count, icon, sort_order)
SELECT id, 'Speaker Driver',  2, 'svgviewer-output-4.svg', 0 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;
INSERT INTO product_outputs (product_id, name, count, icon, sort_order)
SELECT id, 'Headphone 1/4"', 1, 'svgviewer-output-5.svg', 1 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;
INSERT INTO product_outputs (product_id, name, count, icon, sort_order)
SELECT id, 'Sub Out',         1, 'svgviewer-output-6.svg', 2 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;

-- Specs
INSERT INTO product_specs (product_id, label, value, sort_order)
SELECT id, 'Sample Rate',  '48kHz – 192kHz', 0 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;
INSERT INTO product_specs (product_id, label, value, sort_order)
SELECT id, 'Max SPL',      '105 dB',         1 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;
INSERT INTO product_specs (product_id, label, value, sort_order)
SELECT id, 'Form Factor',  '1u rack',        2 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;
INSERT INTO product_specs (product_id, label, value, sort_order)
SELECT id, 'Warranty',     '1 year',         3 FROM products WHERE slug = 'pag-x1-monitor' ON CONFLICT DO NOTHING;
