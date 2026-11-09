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

`render.yaml` defines the API service. Set the environment variables in the Render dashboard, including the production frontend URL in `CLIENT_URL`. Multiple allowed origins can be comma-separated.

### Frontend (Vercel)

Import the `frontend` directory, set `VITE_API_URL` to the deployed API URL, and deploy. `frontend/vercel.json` rewrites client-side routes to `index.html`.

Ensure MongoDB Atlas network access allows the backend host. Cloudinary credentials must be configured before testing uploads.

## Verification

Completed locally:

- Backend syntax check across all application JS files
- Backend health check with MongoDB connection
- Frontend production build
- Frontend ESLint check
- `npm audit` reports zero known vulnerabilities for both packages
- `npm run verify:fixes` — 11/11 regression checks pass (malformed ids, price filters, upload errors, review deletion, password-reset responses)

## Audit remediation

The findings in `audit/website-audit-2026-10-31.md` are addressed in code:

- `CastError` responses now return `400` with a generic message instead of `500` (F1)
- Non-numeric `minPrice` / `maxPrice` filters are ignored instead of crashing the list (F2)
- Rejected uploads carry a `400` status (F3)
- Deleting a review resets the linked booking's `isReviewed` flag (F4)
- Forgot-password returns the same message for known and unknown emails; the reset link is only included outside production (F5)

Cloudinary upload success paths (F6) still require real `CLOUDINARY_*` credentials before they can be verified.
