export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return json({ error: 'Database is not connected.' }, 500);
    }

    const data = await request.json();

    const name = clean(data.name);
    const phone = clean(data.phone);
    const email = clean(data.email);
    const service = clean(data.service);
    const preferredDate = clean(data.preferred_date);
    const preferredTime = clean(data.preferred_time);
    const notes = clean(data.notes || '');

    if (!name || !phone || !email || !service || !preferredDate || !preferredTime) {
      return json({ error: 'Please complete all required booking fields.' }, 400);
    }

    const sameDayRequest = isSameDay(preferredDate) ? 1 : 0;

    await env.DB.prepare(`
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, 0)
    `)
      .bind(
        name,
        phone,
        email,
        preferredDate,
        preferredTime,
        service,
        hairIncludedValue(service),
        '',
        '',
        notes,
        sameDayRequest
      )
      .run();

    return json({ ok: true, message: 'Booking request received.' });
  } catch (error) {
    return json({ error: 'Request failed. Please try again.' }, 500);
  }
}

function clean(value) {
  return String(value || '').trim().slice(0, 2000);
}

function hairIncludedValue(service) {
  const text = String(service || '').toLowerCase();
  if (text.includes('braid') || text.includes('knotless') || text.includes('stitch') || text.includes('fulani')) {
    return 'Natural colors only: 1, 1B, 2, 4';
  }
  return '';
}

function isSameDay(dateValue) {
  const selected = new Date(dateValue);
  if (Number.isNaN(selected.getTime())) return 0;
  const now = new Date();
  return selected.getFullYear() === now.getFullYear() &&
    selected.getMonth() === now.getMonth() &&
    selected.getDate() === now.getDate();
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}
