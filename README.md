# StudioSpace

StudioSpace is a creative-space marketplace where users can discover studios,
create listings, and manage bookings.

- Features: email/password and optional Google authentication, studio CRUD,
  studio search and category filters, booking management, studio reviews,
  and account settings.
- Tech stack: Next.js App Router, React, TypeScript, Better Auth, Express, and
  MongoDB.
- Live site: not deployed yet.
- API setup and deployment steps: see the
  [parent Studio-Space repository](https://github.com/Rafi739/Studio-Space#readme).
- Examiner access: create an account from the Register page; no shared test
  account has been provisioned.

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the
Express API origin (use `http://localhost:4000` for local development). Set
`NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` only when Google OAuth is configured on
the API. Then run `npm install` and `npm run dev` from this directory.

For production, configure `NEXT_PUBLIC_API_URL` in the Vercel project before
building; it must point to the deployed API origin. The API runs and deploys
independently from this frontend. See the parent repository README for server
setup, environment variables, and deployment steps.
