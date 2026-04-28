export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const required = ['name', 'phone', 'service', 'preferred_date', 'preferred_time'];
    for (const key of required) {
      if (!data[key] || String(data[key]).trim().length < 2) {
        return json({ error: `Missing ${key.replace('_', ' ')}` }, 400);
      }
    }

    if (!env.DB) {
      return json({ error: 'Database is not connected. Add the DB D1 binding in Cloudflare Pages.' }, 500);
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO bookings (id, name, phone, email, service, preferred_date, preferred_time, notes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))`)
      .bind(id, clean(data.name), clean(data.phone), clean(data.email || ''), clean(data.service), clean(data.preferred_date), clean(data.preferred_time), clean(data.notes || ''))
      .run();

    return json({ ok: true, id });
  } catch (error) {
    return json({ error: 'Unable to save booking request.' }, 500);
  }
}

function clean(value) {
  return String(value || '').trim().slice(0, 2000);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}
