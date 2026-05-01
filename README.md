# Ravishing Beautè Website

Ready-to-upload website for GitHub + Cloudflare Pages with a built-in booking form.

## Pages included
- Home
- About Your Stylist
- Services & Pricing
- Gallery
- Booking
- Contact
- Policies

## Included API routes
- `/api/reviews` from `functions/api/reviews.js`
- `/api/booking` from `functions/api/booking.js`
- `/api/admin-bookings` from `functions/api/admin-bookings.js`

## What the booking form does
The booking page now submits appointment requests directly through the site. Requests are saved to a Cloudflare D1 database through a Pages Function.

## Quick deploy steps
1. Create a new GitHub repository.
2. Upload every file from this folder into the repo root.
3. In Cloudflare Pages, choose **Connect to Git**.
4. Select this repository.
5. Use these settings:
   - Framework preset: **None**
   - Build command: **leave blank**
   - Build output directory: **leave blank**
6. Deploy.

## Turn on live booking storage
1. In Cloudflare, create a D1 database for the site.
2. Open your Pages project.
3. Go to **Settings** → **Bindings**.
4. Add a **D1 database** binding named `DB`.
5. Redeploy the site.

The booking API also creates the `bookings` table automatically on first submission. A starter `schema.sql` file is included if you want to create the table manually.

## Hidden admin page
- Hidden route: `studio-portal.html`
- Add a Cloudflare Pages secret named `ADMIN_KEY`
- Use the same value on the hidden admin page to view and update bookings

## Important edits before going live
- Add your real deposit payment instructions in `booking.html`
- Replace or add Instagram Reel embed links in `gallery.html`
- Update hours, contact details, and any pricing changes as needed
- Add your custom domain in Cloudflare Pages

## Optional next upgrade
The next strong upgrade would be booking alerts by email or text whenever a new request comes in.


## Email alerts for new bookings
Add these Cloudflare Pages secrets before redeploying:

- `RESEND_API_KEY`
- `BOOKING_ALERT_TO`
- `BOOKING_FROM` (example: `Bookings <bookings@bookings.ravishingbeaute.salon>`)

The booking API now sends an email alert after each successful booking save. If the email service is not configured yet, the booking still saves normally and the alert is skipped.


## Scheduling rules
- Public booking hours: 8:30 AM to 6:00 PM
- Closed days: Sunday and Monday
- Same-day requests are allowed, but they are saved as `same-day approval needed` until approved in the admin dashboard
- Admin can set `approved_date`, `approved_time`, `same_day_approved`, and internal notes
