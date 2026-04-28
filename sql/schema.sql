CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'new',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  review TEXT NOT NULL,
  approved INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

INSERT INTO reviews (id, name, rating, review, approved, created_at)
VALUES
  ('seed-1', 'Ravishing Beauté Client', 5, 'Professional, clean, and polished from start to finish.', 1, datetime('now')),
  ('seed-2', 'Ravishing Beauté Client', 5, 'The style came out neat and exactly how I wanted.', 1, datetime('now'))
ON CONFLICT(id) DO NOTHING;
