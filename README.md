# EDUNEXA — Learning Management System

EDUNEXA is a web-based learning platform where students can discover courses, follow lessons, track their progress, and complete assessments. Educators can manage course content and review learner progress. The project also includes payment checkout, an AI Mentor, and an administrator workspace.

## Features

### Students
- Browse and search published courses, with topic and difficulty filters.
- View course details, curriculum, instructor, and price.
- Enroll in free courses or purchase paid courses.
- Access lessons after enrollment and mark lessons as complete.
- Track course progress from the learner dashboard.
- Keep notes, take quizzes, submit assignments, and read educator feedback.
- Request a certificate after completing the course requirements.
- Submit reviews for enrolled courses and ask the AI Mentor questions.

### Educators
- Create, edit, publish, and unpublish courses.
- Add sections, lessons, video links, resources, previews, thumbnails, tags, and prices.
- View enrolled students and their progress.
- Create quizzes and assignments, then grade submissions.
- Upload thumbnails through Cloudinary or use a public image URL.

### Administration and platform services
- Admin dashboard for platform metrics, user management, course moderation, payment records, review moderation, and audit logs.
- Role-based authorization enforced by the API.
- Stripe Checkout with server-side payment verification and signed webhook handling.
- MongoDB persistence for users, courses, enrollments, payments, and learning records.
- Optional OpenAI-powered responses in the AI Mentor.
- API rate limiting, security headers, CORS configuration, input validation, and upload restrictions.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Authentication | Clerk (required by the current frontend) |
| Payments | Stripe Checkout and webhooks |
| Optional services | Cloudinary for thumbnails; OpenAI API for the AI Mentor |

## Requirements

- Node.js 20 or newer (Node.js 22 is recommended)
- npm
- MongoDB running locally or a MongoDB Atlas connection string
- A Clerk application for the current frontend startup
- Stripe test credentials to test paid course checkout

## Run locally

Run the commands below from the project root (the folder containing the root `package.json`).

### 1. Install dependencies

```powershell
npm run install:all
```

### 2. Create environment files

On Windows PowerShell:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

On macOS or Linux:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Do not commit either `.env` file. They contain local settings and may contain private keys.

### 3. Configure MongoDB and the API

Edit `server/.env`. At minimum, check the MongoDB connection and local URLs:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/edemy_lms
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=7d
DEMO_MODE=false
```

If you use MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string and make sure the database user and network access are configured. Keep MongoDB running before seeding the database or starting the app.

### 4. Configure Clerk

The current frontend checks for a Clerk publishable key during startup. Without it, the browser reports that the Clerk publishable key is missing.

Create an application in the [Clerk Dashboard](https://dashboard.clerk.com/) and add the matching keys. In the current code, the frontend stops during startup if `VITE_CLERK_PUBLISHABLE_KEY` is empty, so Clerk setup is required to run the UI even though the backend also contains local-auth endpoints:

`client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

`server/.env`:

```env
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_EDUCATOR_IDS=
```

Use the values from your own Clerk application. `CLERK_EDUCATOR_IDS` accepts a comma-separated list of Clerk user IDs that should have educator access. Other newly registered Clerk users receive the student role. Do not assign roles based on a client-supplied value.

### 5. Seed sample data

Make sure MongoDB is running, then run this from the project root:

```powershell
npm run seed
```

The seed script adds sample courses and local-auth user records. The current frontend requires a Clerk publishable key to start, and when Clerk is enabled the seeded email/password accounts are not the sign-in method. Create an account through your Clerk application to use the website. These seeded credentials are included for local-auth development only:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@edemy.local` | `demo1234` |
| Educator | `educator@edemy.local` | `demo1234` |

To create a development administrator, set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` (at least 12 characters) in `server/.env`, then run the seed command again. The seed script does not create an administrator unless both values are set.

### 6. Start the application

```powershell
npm run dev
```

Open the frontend at [http://localhost:5173](http://localhost:5173). The API health endpoint is [http://localhost:5000/api/health](http://localhost:5000/api/health).

Restart the development server after changing environment variables. If the browser still reports a missing Clerk key, stop Vite with `Ctrl+C` and run `npm run dev` again.

## Stripe payments

Stripe is used for paid course checkout. Keep `DEMO_MODE=false` when testing real Stripe Checkout in test mode. Set the currency to match the course prices entered in the app.

1. Create or sign in to a [Stripe account](https://dashboard.stripe.com/) and enable test mode.
2. Add the Stripe test secret key to `server/.env`:

   ```env
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=
   STRIPE_CURRENCY=usd
   DEMO_MODE=false
   ```

   Keep the Stripe secret key on the server. Never put it in `client/.env` or frontend code.

3. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli) if it is not already available. In a terminal, authenticate with Stripe:

   ```powershell
   npx @stripe/cli login
   ```

4. Start a local webhook listener and keep that terminal open:

   ```powershell
   npx @stripe/cli listen --forward-to localhost:5000/api/webhooks/stripe --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_failed,checkout.session.async_payment_succeeded
   ```

5. Copy the `whsec_...` signing secret printed by the CLI into `STRIPE_WEBHOOK_SECRET` in `server/.env`, then restart the API.
6. Sign in as a student, open a paid course, and continue to Stripe Checkout. For a successful test payment, use `4242 4242 4242 4242`, any future expiry date, and any three-digit CVC.

A course purchase is fulfilled after the server verifies payment through Stripe. The webhook signature is checked, and repeated webhook events are handled safely. The return page also verifies the Checkout Session with Stripe; a redirect alone does not grant course access.

## Optional integrations

### Cloudinary

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `server/.env` to enable thumbnail uploads. The course editor can also accept a public image URL.

### AI Mentor

Set `OPENAI_API_KEY` and, if needed, `OPENAI_MODEL` in `server/.env` to use OpenAI-generated answers. Without a model key, the app uses a local fallback response.

## API overview

All endpoints are prefixed with `/api`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API health check |
| `POST` | `/auth/register` | Register a local student account |
| `POST` | `/auth/login` | Log in with local authentication |
| `GET` | `/courses` | Browse and filter published courses |
| `GET` | `/courses/:id` | View course details |
| `POST` | `/courses/:id/checkout` | Enroll in a free course or start checkout |
| `GET` | `/courses/:id/content` | Retrieve protected course content |
| `GET` | `/enrollments/me` | List the signed-in user's enrollments |
| `POST` | `/webhooks/stripe` | Receive Stripe webhook events |
| `GET` | `/payments/session/:sessionId` | Verify a Stripe Checkout Session |
| `POST` | `/ai/mentor` | Request an AI Mentor response |

Educator, learning, and admin endpoints are also available for course management, assessments, learner progress, and moderation. Access depends on the authenticated user's role.

## Project structure

```text
edunexa/
├── client/
│   └── src/
│       ├── auth/          # Authentication adapters
│       ├── components/    # Shared UI components
│       ├── pages/         # Student, educator, admin and auth pages
│       ├── api.js         # Axios API client
│       └── index.css      # Application styles
├── server/
│   ├── scripts/seed.js    # Demo data and account setup
│   └── src/
│       ├── config/        # Database configuration
│       ├── middleware/    # Authentication and authorization
│       ├── models/        # Mongoose models
│       ├── routes/        # API routes and Stripe webhook
│       └── services/      # Stripe and AI service adapters
└── README.md
```

## Current limitations

- Refund execution and support-ticket workflows are not implemented.
- Email delivery, live sessions/calendar features, and downloadable PDF certificate generation are not implemented.
- Course videos are embedded from YouTube or Vimeo; the app does not provide its own video hosting.
- The administrator payment screen is read-only.
- AI Mentor responses can be inaccurate and should be checked against reliable sources.

Before deploying, remove development credentials, use a secrets manager, configure production authentication and Stripe keys, set up a public HTTPS webhook endpoint, restrict CORS, and secure the database and backups. Test the deployment with Stripe test mode before enabling live payments.
