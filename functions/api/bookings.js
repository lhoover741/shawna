export async function onRequestGet({ request, env }) {
  try {
    const adminKey =
      request.headers.get('x-admin-key') ||
      request.headers.get('x-admin-password') ||
      '';

    if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
      return json({ error: 'Unauthorized. Check your admin key.' }, 401);
    }

    if (!env.DB) {
      return json(
        { error: 'Database is not connected. Add the DB binding.' },
        500
      );
    }

    const result = await env.DB.prepare(`
      SELECT id, name, phone, email, service, preferred_date, preferred_time, notes, status, created_at
      FROM bookings
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    return json({ ok: true, bookings: result.results || [] });
  } catch (error) {
    return json({ error: 'Unable to load bookings.' }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}
