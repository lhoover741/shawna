export async function onRequestGet({ env }) {
  if (!env.DB) return json({ reviews: [] });
  const { results } = await env.DB.prepare(`SELECT name, rating, review, created_at FROM reviews WHERE approved = 1 ORDER BY created_at DESC LIMIT 12`).all();
  return json({ reviews: results || [] });
}
export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    if (!data.name || !data.review) return json({ error: "Please complete all fields." }, 400);
    const rating = Math.max(1, Math.min(5, Number(data.rating || 5)));
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO reviews (id, name, rating, review, approved, created_at) VALUES (?, ?, ?, ?, 0, datetime('now'))`)
      .bind(id, clean(data.name), rating, clean(data.review)).run();
    return json({ ok: true, message: "Review submitted for approval." });
  } catch (error) {
    return json({ error: "Unable to save review." }, 500);
  }
}
function clean(v){ return String(v || "").trim().slice(0, 2000); }
function json(body, status = 200){ return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }); }
