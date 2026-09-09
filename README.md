# Raise Academy — Full Website

A full-stack website for Raise Academy (Muthapudupet, Avadi, Chennai): marketing site, student
registration with email OTP verification, JWT login, an AI Teacher chat assistant, and a basic
admin panel.

## ⚠️ Read before deploying

- **Contact info**: Address and all three phone numbers were pulled directly from
  `raiseacademy.in` and are real. The **email address** and **WhatsApp number** could NOT be
  verified — the email on the live site is Cloudflare-obfuscated, and no WhatsApp number is
  published there. Both are marked with `TODO` comments in
  `frontend/src/utils/siteInfo.ts` — replace them with the real values before going live.
- **Logo**: currently references the logo image hosted on `raiseacademy.in`. Download it and
  place it at `frontend/public/logo.jpeg`, then update the `logoUrl` in `siteInfo.ts` to
  `/logo.jpeg` for a self-hosted copy.
- **AI Teacher** needs a real `OPENAI_API_KEY` (or any OpenAI-compatible endpoint) in
  `backend/.env` to actually respond — without it the endpoint returns a friendly "not
  configured yet" message instead of crashing.
- **Gallery images** are added via the Admin panel as image URLs (e.g., links to images hosted on
  Cloudinary/Imgur/your own server). There's no file-upload storage wired up in this starter.

## Tech stack

- **Frontend**: React + Vite + TypeScript, Tailwind CSS, Framer Motion, React Router, Lucide Icons
- **Backend**: Node.js + Express
- **Database**: MongoDB (via Mongoose)
- **Auth**: JWT
- **OTP**: Email OTP via Nodemailer

## Project structure

```
raise-academy/
├── backend/
│   ├── config/db.js
│   ├── controllers/        # auth, otp, aiTeacher, contact, content
│   ├── middleware/         # JWT auth, error handling
│   ├── models/             # Student, Otp, Testimonial, GalleryItem, ContactMessage
│   ├── routes/
│   ├── scripts/createAdmin.js
│   ├── utils/sendEmail.js
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.ts
    │   ├── components/     # Navbar, Footer, WhatsApp button, Counter, etc.
    │   ├── context/AuthContext.tsx
    │   ├── pages/           # Home, About, Courses, Results, Testimonials, Gallery,
    │   │                     Contact, Login, Register, ForgotPassword, Dashboard,
    │   │                     AITeacher, admin/*
    │   └── utils/siteInfo.ts
    └── .env.example
```

## Setup

### 1. Prerequisites

- Node.js 18+
- A MongoDB database — either local (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for sending OTP emails (or any other SMTP provider)
- An OpenAI API key (or compatible) for the AI Teacher feature

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your MongoDB URI, JWT secret, SMTP credentials, and OpenAI key
npm run dev
```

The API runs on `http://localhost:5000` by default.

To create your first admin login:

```bash
# make sure ADMIN_EMAIL and ADMIN_PASSWORD are set in backend/.env
node scripts/createAdmin.js
```

Then log in on the site with that email/password — you'll land in `/admin` instead of the
student dashboard.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
# defaults point at http://localhost:5000/api, adjust if needed
npm run dev
```

The site runs on `http://localhost:5173`.

### 4. Try it out

1. Go to `/register`, fill in the multi-step form. On the "Verify Email" step, click **Send OTP** —
   check the inbox of the email you used (make sure SMTP is configured correctly in the backend
   `.env`, otherwise this call will fail).
2. Enter the 6-digit code, then complete registration — you'll be logged in automatically.
3. Visit `/ai-teacher` to chat with the AI Teacher (requires `OPENAI_API_KEY` to be set).
4. Log in as the admin account you created and visit `/admin` to manage testimonials, gallery
   images, view registrations (with CSV export), and read contact form submissions.

## Notes on scope

This is a complete, runnable starting point — not a finished, pixel-audited production build.
Realistically finishing a project like this (photography, copy review, load testing, deployment
hardening, accessibility pass, payment integration if you want paid enrollment, etc.) is ongoing
work. Treat this as a strong foundation to keep building on in VS Code.
