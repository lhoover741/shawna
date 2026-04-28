# Ravishing Beauté Website + Backend

Premium mobile-first salon website with a Cloudflare Pages backend.

## Included
- Home, Gallery, Services / Pricing, About Your Stylist, Booking, Reviews, Contact, Policies
- Booking request API
- Contact message API
- Approved public reviews API
- Private admin booking dashboard at `/admin.html`
- Cloudflare D1 database schema

## Cloudflare Pages settings
- Framework preset: None
- Build command: leave blank
- Output directory: `/`

## Required Cloudflare setup
1. Create a D1 database named `ravishing-beaute-db`.
2. Run `sql/schema.sql` against the D1 database.
3. In Cloudflare Pages, add a D1 binding:
   - Variable name: `DB`
   - Database: `ravishing-beaute-db`
4. Add an environment variable:
   - `ADMIN_PASSWORD`
   - Set this to a private password for Shawna/admin access.

## Admin
Visit `/admin.html` and enter the `ADMIN_PASSWORD` value to view booking requests.

## Business rules included
- $25 deposit required
- Hours: 8:30 AM to 6:00 PM by appointment
- Closed Sunday and Monday
- Same-day bookings only if approved
- Braiding hair included only in natural colors 1, 1B, 2, and 4 unless otherwise specified
- Please come detangled to stay on schedule
