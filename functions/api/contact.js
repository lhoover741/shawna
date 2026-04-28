export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    if (!data.name || !data.contact || !data.message) return json({ error: "Please complete all fields." }, 400);
    if (!env.DB) return json({ error: "Database is not connected. Add the DB D1 binding in Cloudflare Pages." }, 500);

    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO contact_messages (id, name, contact, message, status, created_at)
      VALUES (?, ?, ?, ?, 'new', datetime('now'))`)
      .bind(id, clean(data.name), clean(data.contact), clean(data.message))
      .run();

    return json({ ok: true, id });
  } catch (error) {
    return json({ error: "Unable to save message." }, 500);
  }
}
function clean(v){ return String(v || "").trim().slice(0, 2000); }
function json(body, status = 200){ return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }); }
