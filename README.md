# 4tyrezz — Used Cars Marketplace (MERN MVP)

Three separate apps, one MongoDB:

```
backend/    Express + Mongoose API
customer/   React + Redux Toolkit + Tailwind — the public site (mobile+OTP login only)
admin/      React + Redux Toolkit + Tailwind + MUI — separate app, email+password login
```

No admin link or admin login appears anywhere in `customer/`. The two apps talk to the
same backend but are otherwise independent — deploy them to separate subdomains
(`www.` / `admin.`) or hosts.

## 1. Prerequisites

- Node.js 18+
- A MongoDB connection string — either:
  - Local: `brew install mongodb-community` / `apt install mongodb` (or run via Docker: `docker run -d -p 27017:27017 mongo`), or
  - Free hosted: a [MongoDB Atlas](https://www.mongodb.com/atlas) free-tier cluster

> This project was built and syntax/build-checked without a live database available in
> the build environment, so it has **not** been run end-to-end against a real Mongo
> instance yet. Please test the full flow (register → OTP login → list a car → admin
> approve → see it on the site) before relying on it.

## 2. Backend setup

```bash
cd backend
cp .env.example .env      # then set MONGODB_URI to your connection string
npm install
npm run seed               # populates brands, models, cities, admin, dealer, ~44 sample cars
npm start                  # http://localhost:5000
```

Seed script prints your login credentials at the end:
- **Admin:** admin@4tyrezz.com / admin123
- **Dealer:** dealer@4tyrezz.com / dealer123
- **Customer OTP:** mobile `9160415851`, OTP `123456` (mock mode — see below)

### Mock OTP mode
`MOCK_OTP=true` in `.env` (the default) always issues OTP `123456` and returns it in the
API response as `devOtp`, so the customer app can show it on-screen for easy testing —
no Twilio/Firebase account needed. **Before going to production**, set `MOCK_OTP=false`
and wire a real provider into `backend/controllers/authController.js` (`requestOtp`) —
there's a `// TODO` marking exactly where.

## 3. Customer app

```bash
cd customer
npm install
npm run dev                # http://localhost:5173
```

## 4. Admin app

```bash
cd admin
npm install
npm run dev                # http://localhost:5174
```

Run all three (`backend`, `customer`, `admin`) at the same time, each in its own
terminal, for the full experience.

## What's implemented

**Auth:** mobile+OTP (customer, mock provider), email+password (dealer, admin), JWT,
role-based route guards on both API and frontend.

**Customer:** Home (hero/search, stats, featured/latest/premium, popular brands,
browse by budget/fuel/body type, inspection-process explainer, testimonials, FAQs),
Listing (filters + sort + pagination), Car Details (gallery, specs, features,
inspection score, similar cars, contact-seller), Add/Edit/Delete own car, My
Dashboard (My Cars / Wishlist / Profile), Dealer Dashboard (Inventory / Leads /
Profile), About/Contact/Blog/FAQ pages.

**Admin:** Dashboard (5 stat cards + monthly-listings chart), Car Management +
Approvals queue (approve/reject/mark sold, feature/premium flags), User Management,
Dealer Management (with an add-dealer form), Brand/Model/City management (shared
generic CRUD component).

**API:** REST, documented by route file in `backend/routes/`. Search, filtering,
sorting, and pagination on `/api/cars`. Image upload via multer (local disk —
swap for S3/Cloudinary before production).

## What's intentionally stubbed for later

Per the brief, these are out of scope for this MVP pass:
- Real SMS/OTP provider (Twilio/Firebase) — mock mode only, see above
- Bidding, in-app chat, payments, financing, PDF inspection reports
- Profile-save endpoint (`Profile.jsx` has a `// TODO` — needs `PUT /api/users/me`)
- Compare Cars, Dealer public profile pages, Recently Viewed/Recommended sections
- Categories module (separate from body type), Notifications, CMS/Banners in admin
- Real image storage (currently local disk under `backend/uploads/`)

## Design system

Ink navy `#0D1B4C` + a single ember accent `#E8491D` + verify green `#1F9D6C` for
trust/inspection signals only. Big Shoulders Display for headlines/numbers, Inter for
body text. The inspection-score badge and tyre-tread motif are the recurring signature
elements tying the UI back to 4tyrezz's actual differentiator (manual inspection),
rather than generic decoration. Tokens live in each app's `tailwind.config.js`.

## Production checklist before launch

- [ ] Real MongoDB instance, tested end-to-end
- [ ] Real OTP provider (Twilio/Firebase)
- [ ] Move uploads to S3/Cloudinary + CDN
- [ ] `JWT_SECRET` rotated to a real secret, not the placeholder
- [ ] Rate limiting on `/api/auth/otp/request`
- [ ] HTTPS + separate subdomains for `customer` and `admin`
- [ ] Input validation hardening (express-validator is installed but not yet wired into every route)
