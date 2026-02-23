# Event Management App (Next.js)

Minimal but complete event management app built with Next.js App Router, Next.js API route handlers, Prisma, and SQLite.

## What is implemented

- Authentication
- Register, login, logout
- Password hashing (`crypto.scrypt`)
- Persistent signed cookie session (HTTP-only)
- Protected app routes (server-side guard)
- User Management
- User creation (register and admin create user)
- View/update own profile
- Admin-only user listing and update
- Role-Based Authorization
- Roles: `ADMIN`, `USER`
- API-level authorization checks
- UI-level permission checks (restricted actions hidden)
- Event Management (CRUD)
- Create, update, list, view, delete events
- Ownership rules enforced (admin can manage all)
- Recurring Events
- Daily, weekly, monthly recurrence
- End by date/time OR by number of occurrences
- Occurrence generation for date ranges
- Calendar View
- Month view
- Recurring occurrences rendered
- Click occurrence to open event details
- Backend in Next.js only
- Auth APIs
- Users APIs
- Events CRUD APIs
- Occurrence/date-range API
- No external backend service

## Stack

- Next.js App Router
- Route Handlers (`app/api/*`)
- Prisma + SQLite
- React + TypeScript
- FullCalendar (month calendar UI)
- Tailwind CSS + shadcn-style UI components

## Database schema

- `User`
- `id`, `name`, `email`, `passwordHash`, `role`, `createdAt`, `updatedAt`
- `Event`
- Base fields: `id`, `title`, `description`, `startDateTime`, `endDateTime`, `recurrence`, `recurrenceEndsAt`, `recurrenceCount`, `createdById`, `createdAt`, `updatedAt`
- Bonus recurrence fields: `excludedDatesJson`, `parentEventId`, `occurrenceDate`, `isOccurrenceOverride`

Schema file: `prisma/schema.prisma`

## Setup

1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
cp .env.example .env
```

3. Set a strong session secret in `.env`

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="replace_with_a_long_random_secret"
```

Generate a strong value:

```bash
openssl rand -base64 48
```

4. Generate Prisma client

```bash
npm run prisma:generate
```

5. Initialize database

Preferred:

```bash
npm run db:push
```

If `db:push` fails in your local environment, use fallback init:

```bash
npm run db:init
```

6. (Optional) Seed admin user

```bash
npm run db:seed
```

Seeded admin credentials:

- Email: `admin@example.com`
- Password: `admin123`

7. Run app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Docker (optional)

Build and run:

```bash
docker compose up --build
```

App runs on `http://localhost:3000`.

## API endpoints

- Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- Users
- `GET /api/users` (admin)
- `POST /api/users` (admin)
- `GET /api/users/[id]` (admin or self)
- `PATCH /api/users/[id]` (admin or self, role change admin-only)
- `GET /api/users/me`
- `PATCH /api/users/me`
- Events
- `GET /api/events`
- `POST /api/events`
- `GET /api/events/[id]`
- `PATCH /api/events/[id]`
- `DELETE /api/events/[id]`
- `GET /api/events/occurrences?start=ISO&end=ISO`
- `POST /api/events/[id]/occurrence` (edit single occurrence, exclude occurrence date, and drag/drop persistence)

## Notes

- First registered user becomes `ADMIN` automatically.
- Role and ownership checks are enforced in both API routes and UI.
- Calendar month view includes recurring occurrences generated from recurrence rules.
- Responsive full-screen app shell with collapsible sidebar is included.
- Loading states are implemented in forms/buttons and route-level skeleton loading screens.
- Black/white design system with dark mode toggle is included (system-aware via `next-themes`).

## Bonus implemented

- Edit single occurrence of recurring event
  - From event details or calendar click, open occurrence-specific editor.
- Exclude specific occurrence dates
  - Exclude action available from occurrence rows.
- Week/day calendar views
  - `Month`, `Week`, `Day`, and `List` views available.
- Drag & drop and resize in calendar
  - Persists changes via occurrence-aware API route.
- Docker setup
  - `Dockerfile`, `docker-compose.yml`, `.dockerignore` included.
