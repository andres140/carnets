CREATE TABLE IF NOT EXISTS carnets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  usuario TEXT NOT NULL,
  rol TEXT,
  centro TEXT,
  estado TEXT NOT NULL DEFAULT 'Activo',
  fecha_expedicion TEXT NOT NULL,
  fecha_vencimiento TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_carnets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  carnet_id INTEGER NOT NULL,
  accion TEXT NOT NULL,
  fecha TEXT NOT NULL,
  observacion TEXT,
  usuario TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auditoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  carnet_id INTEGER,
  usuario TEXT NOT NULL,
  accion TEXT NOT NULL,
  fecha TEXT NOT NULL,
  ip TEXT,
  observaciones TEXT
);
