const jsonHeaders = {
  'content-type': 'application/json; charset=UTF-8',
  'cache-control': 'no-store'
};

const CHICAGO_TZ = 'America/Chicago';
const CLOSED_DAYS = [0, 1];
const START_TIME = '08:30';
const END_TIME = '18:00';

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function getChicagoToday() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHICAGO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(new Date());
}

function isClosedDay(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  return CLOSED_DAYS.includes(date.getDay());
}

function isTimeWithinHours(value) {
  return /^\d{2}:\d{2}$/.test(value) && value >= START_TIME && value <= END_TIME;
}

async function sendBookingAlert(env, booking) {
  if (!env.RESEND_API_KEY || !env.BOOKING_ALERT_TO || !env.BOOKING_FROM) {
    return { skipped: true };
  }

  const hairText = booking.hairIncluded || 'Not specified';
  const lengthText = booking.lengthNotes || 'Not specified';
  const addonsText = booking.addons.length ? booking.addons.join(', ') : 'None';
  const notesText = booking.notes || 'None';
  const sameDayText = booking.sameDayRequest ? 'Yes - approval required before it can be confirmed.' : 'No';

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:620px;margin:0 auto;">
      <h2 style="margin-bottom:16px;">New Booking Request</h2>
      <p><strong>Name:</strong> ${escapeHtml(booking.name)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(booking.phone)}</p>
      <p><strong>Email:</strong> ${escapeHtml(booking.email)}</p>
      <p><strong>Service:</strong> ${escapeHtml(booking.service)}</p>
      <p><strong>Preferred Date:</strong> ${escapeHtml(booking.preferredDate)}</p>
      <p><strong>Preferred Time:</strong> ${escapeHtml(booking.preferredTime)}</p>
      <p><strong>Same-Day Request:</strong> ${escapeHtml(sameDayText)}</p>
      <p><strong>Hair Included:</strong> ${escapeHtml(hairText)}</p>
      <p><strong>Length Notes:</strong> ${escapeHtml(lengthText)}</p>
      <p><strong>Add-ons:</strong> ${escapeHtml(addonsText)}</p>
      <p><strong>Notes:</strong> ${escapeHtml(notesText)}</p>
      <p><strong>Booking ID:</strong> ${escapeHtml(booking.bookingId)}</p>
    </div>
  `;

  const text = [
    'New Booking Request',
    `Name: ${booking.name}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email}`,
    `Service: ${booking.service}`,
    `Preferred Date: ${booking.preferredDate}`,
    `Preferred Time: ${booking.preferredTime}`,
    `Same-Day Request: ${sameDayText}`,
    `Hair Included: ${hairText}`,
    `Length Notes: ${lengthText}`,
    `Add-ons: ${addonsText}`,
    `Notes: ${notesText}`,
    `Booking ID: ${booking.bookingId}`
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.BOOKING_FROM,
      to: [env.BOOKING_ALERT_TO],
      subject: `New booking request: ${booking.service} - ${booking.name}`,
      html,
      text,
      reply_to: booking.email
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend send failed: ${errorText}`);
  }

  return { sent: true };
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      Allow: 'POST, OPTIONS'
    }
  });
}

export async function onRequestPost(context) {
  try {
    if (!context.env.DB) {
      return json({
        error: 'Booking storage is not connected yet. Add a D1 binding named DB to enable site bookings.'
      }, 503);
    }

    const contentType = context.request.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await context.request.json()
      : Object.fromEntries(await context.request.formData());

    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 160).toLowerCase();
    const preferredDate = clean(body.preferredDate, 30);
    const preferredTime = clean(body.preferredTime, 40);
    const service = clean(body.service, 120);
    const hairIncluded = clean(body.hairIncluded, 120);
    const lengthNotes = clean(body.lengthNotes, 180);
    const notes = clean(body.notes, 2000);
    const website = clean(body.website, 100);
    const agreePolicies = body.agreePolicies === true || body.agreePolicies === 'true' || body.agreePolicies === 'on';
    const addons = Array.isArray(body.addons)
      ? body.addons.map(item => clean(item, 80)).filter(Boolean)
      : clean(body.addons, 80)
        ? [clean(body.addons, 80)]
        : [];

    if (website) {
      return json({ ok: true, message: 'Your booking request was submitted successfully.' });
    }

    if (!name || !phone || !email || !preferredDate || !preferredTime || !service) {
      return json({ error: 'Please complete all required booking fields.' }, 400);
    }

    if (!agreePolicies) {
      return json({ error: 'You must agree to the booking policies before submitting.' }, 400);
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return json({ error: 'Please enter a valid email address.' }, 400);
    }

    const date = new Date(`${preferredDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return json({ error: 'Please choose a valid preferred date.' }, 400);
    }

    if (isClosedDay(preferredDate)) {
      return json({ error: 'Appointments cannot be requested on Sunday or Monday. Please choose Tuesday through Saturday.' }, 400);
    }

    if (!isTimeWithinHours(preferredTime)) {
      return json({ error: 'Please request a start time between 8:30 AM and 6:00 PM.' }, 400);
    }

    await ensureTable(context.env.DB);

    const sameDayRequest = preferredDate === getChicagoToday();
    const status = sameDayRequest ? 'same-day approval needed' : 'new';

    const result = await context.env.DB.prepare(`
      INSERT INTO bookings (
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
        same_day_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        name,
        phone,
        email,
        preferredDate,
        preferredTime,
        service,
        hairIncluded,
        lengthNotes,
        JSON.stringify(addons),
        notes,
        status,
        sameDayRequest ? 1 : 0,
        0
      )
      .run();

    const bookingId = result?.meta?.last_row_id || null;

    try {
      await sendBookingAlert(context.env, {
        bookingId: bookingId ? String(bookingId) : 'N/A',
        name,
        phone,
        email,
        preferredDate,
        preferredTime,
        service,
        hairIncluded,
        lengthNotes,
        addons,
        notes,
        sameDayRequest
      });
    } catch (alertError) {
      console.error(alertError);
    }

    return json({
      ok: true,
      bookingId,
      sameDayRequest,
      message: sameDayRequest
        ? 'Your same-day booking request was submitted and is pending approval. We will follow up before anything is confirmed.'
        : 'Your booking request was submitted. We will review it and follow up with approval and deposit instructions.'
    });
  } catch (error) {
    console.error(error);
    return json({ error: 'Something went wrong while saving your booking request.' }, 500);
  }
}
