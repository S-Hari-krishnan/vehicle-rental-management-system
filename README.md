# Vishnu Rentals — Vehicle Rental Management System

Production-oriented MERN application for renting and managing cars and bikes.

## Features

- User, owner, and admin roles with protected API/frontend routes
- JWT authentication, profile management, avatar upload, and password reset
- Cloudinary image/document uploads with signed document URLs
- Vehicle approval workflow with owner rejection feedback
- Availability management, blocked dates, and booking conflict detection
- User bookings, cancellation, reviews, and ratings
- Owner dashboard, fleet management, and booking actions
- Admin dashboards, users, vehicle approvals, bookings, and revenue analytics
- Search, filters, sorting, and pagination
- Helmet, rate limiting, request sanitization, CORS allowlist, and centralized errors

## Stack

- Frontend: React 19, Vite, Bootstrap, Axios, react-router-dom, react-datepicker, Chart.js
- Backend: Express 5, MongoDB/Mongoose, JWT, Zod, Multer, Cloudinary
- Database: MongoDB Atlas or a local MongoDB instance

## Local Setup

```powershell
cd backend
npm install
copy .env.example .env
npm run dev
```

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`  
Health check: `http://localhost:5000/health`

### Backend Environment

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_password
```

Create or update the admin account:

```powershell
cd backend
npm run create-admin
```

Cloudinary is required for new image/document uploads. Legacy files in `backend/uploads` continue to work.

### Frontend Environment

```env
VITE_API_URL=http://localhost:5000
```

## Scripts

Backend:

- `npm run dev` — start with nodemon
- `npm start` — production server
- `npm run create-admin` — create/update the configured admin
- `npm run verify:fixes` — regression checks for the audit fixes (requires the API running and MongoDB connected)
- `npm run verify:uploads` — Cloudinary upload checks for avatar, vehicle image, RC, and insurance (requires the API running, MongoDB connected, and Cloudinary configured)

Frontend:

- `npm run dev` — Vite development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run preview` — preview the production build

## Roles and Main Routes

- Public: `/home`, `/login`, `/signup`, `/forgot-password`, `/reset-password/:token`
- User: `/user/home`, `/vehicles/cars`, `/vehicles/bikes`, `/vehicle/:id`, `/bookings/user`, `/profile`
- Owner: `/owner/dashboard`, `/owner/add-vehicle`, `/owner/my-vehicles`, `/owner/edit-vehicle/:id`, `/owner/bookings`
- Admin: `/admin/login`, `/admin/dashboard`, `/admin/users`, `/admin/vehicles`, `/admin/bookings`

## Deployment

### Backend (Render)

1. Create a **Blueprint** (or Web Service) from the repository; `render.yaml` already sets the root directory, start command, and `/health` check.
2. Set these environment variables in the Render dashboard:

   | Variable | Value |
   | --- | --- |
   | `MONGO_URI` | MongoDB Atlas connection string |
   | `JWT_SECRET` | long random secret |
   | `CLIENT_URL` | deployed frontend URL (comma-separated if more than one) |
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | Cloudinary API secret |
   | `ADMIN_EMAIL` | admin login email |
   | `ADMIN_PASSWORD` | strong admin password |

3. After the first deploy, run `npm run create-admin` once (Render Shell) to create/update the admin.
4. Confirm `https://<api-host>/health` returns `database: connected`.

### Frontend (Vercel)

1. Import the repository and set the project root to `frontend` (framework: Vite).
2. Set `VITE_API_URL` to the deployed API URL.
3. Deploy. `frontend/vercel.json` rewrites client-side routes to `index.html`.
4. Update Render's `CLIENT_URL` to the final Vercel URL and redeploy the API.

Ensure MongoDB Atlas network access allows the backend host. Cloudinary credentials must be configured before testing uploads.

## Verification

Completed locally:

- Backend syntax check across all application JS files
- Backend health check with MongoDB connection
- Frontend production build
- Frontend ESLint check
- `npm audit` reports zero known vulnerabilities for both packages
- `npm run verify:fixes` — 11/11 regression checks pass (malformed ids, price filters, upload errors, review deletion, password-reset responses)
- `npm run verify:uploads` — 11/11 Cloudinary checks pass (avatar, vehicle image, RC, insurance, signed and downloadable document URLs)

## Audit remediation

The findings in `audit/website-audit-2026-10-31.md` are addressed in code:

- `CastError` responses now return `400` with a generic message instead of `500` (F1)
- Non-numeric `minPrice` / `maxPrice` filters are ignored instead of crashing the list (F2)
- Rejected uploads carry a `400` status (F3)
- Deleting a review resets the linked booking's `isReviewed` flag (F4)
- Forgot-password returns the same message for known and unknown emails; the reset link is only included outside production (F5)

Cloudinary upload success paths (F6) are verified locally with real credentials: avatar, vehicle image, RC (PDF), and insurance uploads work, and both documents return signed, downloadable URLs. PDF downloads require **Settings → Security → "Allow delivery of PDF and ZIP files"** to be enabled in the Cloudinary console (it now is).

Run `npm run verify:fixes` and `npm run verify:uploads` (with the API running) to repeat the regression and upload checks.
