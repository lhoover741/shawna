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
    const hairIncluded = hairIncludedValue(service);

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
        hairIncluded,
        '',
        '',
        notes,
        sameDayRequest
      )
      .run();

    await sendBookingAlert(env, {
      name,
      phone,
      email,
      service,
      preferredDate,
      preferredTime,
      notes,
      hairIncluded,
      sameDayRequest
    });

    return json({ ok: true, message: 'Booking request received.' });
  } catch (error) {
    return json({ error: 'Request failed. Please try again.' }, 500);
  }
}

async function sendBookingAlert(env, booking) {
  if (!env.RESEND_API_KEY || !env.BOOKING_ALERT_TO || !env.BOOKING_FROM) {
    return;
  }

  const subject = `New Ravishing Beauté booking request - ${booking.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background:#f7f2ef; padding:24px; color:#2b1d1a;">
      <div style="max-width:640px; margin:0 auto; background:#fff; border-radius:18px; overflow:hidden; border:1px solid #eaded8;">
        <div style="background:#2b1d1a; color:#fff; padding:22px 24px;">
          <p style="margin:0; letter-spacing:.12em; text-transform:uppercase; font-size:12px; color:#e8cfc4;">Ravishing Beauté</p>
          <h1 style="margin:6px 0 0; font-size:24px;">New Booking Request</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin-top:0;">A new client submitted a booking request.</p>
          ${row('Client', booking.name)}
          ${row('Phone', booking.phone)}
          ${row('Email', booking.email)}
          ${row('Service', booking.service)}
          ${row('Preferred Date', booking.preferredDate)}
          ${row('Preferred Time', booking.preferredTime)}
          ${row('Hair Included', booking.hairIncluded || 'Not specified')}
          ${row('Same-Day Request', booking.sameDayRequest ? 'Yes - approval required' : 'No')}
          ${row('Notes', booking.notes || 'No notes provided')}
          <p style="margin-top:24px; padding:14px 16px; background:#f7f2ef; border-radius:12px; font-size:14px;">Open the Ravishing Beauté admin dashboard to review and follow up.</p>
        </div>
      </div>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: env.BOOKING_FROM,
      to: [env.BOOKING_ALERT_TO],
      subject,
      html
    })
  });
}

function row(label, value) {
  return `<div style="border-top:1px solid #eaded8; padding:12px 0;"><strong style="display:block; font-size:13px; color:#7a5b52; text-transform:uppercase; letter-spacing:.08em;">${escapeHTML(label)}</strong><span style="font-size:16px;">${escapeHTML(value)}</span></div>`;
}

function escapeHTML(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
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
