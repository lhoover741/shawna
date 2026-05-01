const jsonHeaders = {
  'content-type': 'application/json; charset=UTF-8',
  'cache-control': 'no-store'
};

const allowedStatuses = [
  'new',
  'same-day approval needed',
  'reviewing',
  'approved',
  'deposit requested',
  'confirmed',
  'completed',
  'declined'
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders
  });
}

function clean(value, max = 500) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

async function addColumnIfMissing(db, name, definition) {
  const info = await db.prepare('PRAGMA table_info(bookings)').all();
  const columns = Array.isArray(info.results) ? info.results.map(item => item.name) : [];
  if (!columns.includes(name)) {
    await db.prepare(`ALTER TABLE bookings ADD COLUMN ${name} ${definition}`).run();
  }
}

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      service TEXT NOT NULL,
      hair_included TEXT,
      length_notes TEXT,
      addons TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      same_day_request INTEGER NOT NULL DEFAULT 0,
      same_day_approved INTEGER NOT NULL DEFAULT 0,
      approved_date TEXT,
      approved_time TEXT,
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await addColumnIfMissing(db, 'same_day_request', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'same_day_approved', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'approved_date', 'TEXT');
  await addColumnIfMissing(db, 'approved_time', 'TEXT');
  await addColumnIfMissing(db, 'admin_notes', 'TEXT');
}

function requireAdmin(context) {
  const expectedKey = clean(context.env.ADMIN_KEY, 200);
  if (!expectedKey) {
    return json({
      error: 'Admin access is not configured yet. Add a Pages secret named ADMIN_KEY before using the hidden admin page.'
    }, 503);
  }

  const providedKey = clean(context.request.headers.get('x-admin-key'), 200);
  if (!providedKey) {
    return json({ error: 'Admin key required.' }, 401);
  }

  if (providedKey !== expectedKey) {
    return json({ error: 'Admin key is incorrect.' }, 403);
  }

  return null;
}

function parseAddons(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isValidDate(value) {
  if (!value) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function isValidTime(value) {
  if (!value) return true;
  return /^\d{2}:\d{2}$/.test(value);
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      Allow: 'GET, PATCH, OPTIONS'
    }
  });
}

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) {
      return json({ error: 'Booking storage is not connected yet. Add a D1 binding named DB first.' }, 503);
    }

    const authError = requireAdmin(context);
    if (authError) return authError;

    await ensureTable(context.env.DB);

    const response = await context.env.DB.prepare(`
      SELECT
        id,
        name,
        phone,
        email,
        preferred_date,
        preferred_time,
        service,
        hair_included,
        length_notes,
        addons,
        notes,
        status,
        same_day_request,
        same_day_approved,
        approved_date,
        approved_time,
        admin_notes,
        created_at
      FROM bookings
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT 250
    `).all();

    const bookings = Array.isArray(response.results)
      ? response.results.map(item => ({
          ...item,
          same_day_request: Boolean(item.same_day_request),
          same_day_approved: Boolean(item.same_day_approved),
          addons: parseAddons(item.addons)
        }))
      : [];

    return json({ ok: true, bookings, statuses: allowedStatuses });
  } catch {
    return json({ error: 'Unable to load bookings right now.' }, 500);
  }
}

export async function onRequestPatch(context) {
  try {
    if (!context.env.DB) {
      return json({ error: 'Booking storage is not connected yet. Add a D1 binding named DB first.' }, 503);
    }

    const authError = requireAdmin(context);
    if (authError) return authError;

    await ensureTable(context.env.DB);

    const body = await context.request.json().catch(() => ({}));
    const id = Number(body.id);
    const status = clean(body.status, 40).toLowerCase();
    const approvedDate = clean(body.approvedDate, 20);
    const approvedTime = clean(body.approvedTime, 10);
    const adminNotes = clean(body.adminNotes, 2000);
    const sameDayApproved = body.sameDayApproved === true || body.sameDayApproved === 'true' || body.sameDayApproved === 1;

    if (!Number.isInteger(id) || id <= 0) {
      return json({ error: 'A valid booking ID is required.' }, 400);
    }

    if (!allowedStatuses.includes(status)) {
      return json({ error: 'Please choose a valid booking status.' }, 400);
    }

    if (!isValidDate(approvedDate)) {
      return json({ error: 'Approved date must be a valid date.' }, 400);
    }

    if (!isValidTime(approvedTime)) {
      return json({ error: 'Approved time must be a valid time.' }, 400);
    }

    const existing = await context.env.DB.prepare(
      'SELECT id, same_day_request FROM bookings WHERE id = ? LIMIT 1'
    ).bind(id).first();

    if (!existing) {
      return json({ error: 'Booking not found.' }, 404);
    }

    await context.env.DB.prepare(
      `UPDATE bookings
       SET status = ?, approved_date = ?, approved_time = ?, same_day_approved = ?, admin_notes = ?
       WHERE id = ?`
    ).bind(
      status,
      approvedDate || null,
      approvedTime || null,
      sameDayApproved ? 1 : 0,
      adminNotes || null,
      id
    ).run();

    return json({
      ok: true,
      message: 'Booking details updated.',
      id,
      status,
      approvedDate,
      approvedTime,
      sameDayApproved,
      adminNotes
    });
  } catch {
    return json({ error: 'Unable to update this booking right now.' }, 500);
  }
}
