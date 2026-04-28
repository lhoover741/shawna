export async function onRequestGet({ request, env }) {
  const adminKey = request.headers.get("x-admin-key") || request.headers.get("x-admin-password") || "";

  if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
    return json({ error: "Invalid admin key." }, 401);
  }

  if (!env.DB) {
    return json({ error: "Database is not connected." }, 500);
  }

  const { results } = await env.DB.prepare(`
    SELECT * FROM bookings
    ORDER BY created_at DESC
    LIMIT 100
  `).all();

  return json({ bookings: results || [] });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
