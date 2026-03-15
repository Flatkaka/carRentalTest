# Car Rental App

A full-stack car rental platform built with Next.js 15, Supabase, and Tailwind CSS.

## Features

- **Browse cars** — search by location, filter by availability, dates, fuel type, and transmission
- **Car detail pages** — image gallery, specs, and booking widget with date picker
- **Bookings** — create, view, and cancel bookings from your dashboard
- **Interactive map** — Mapbox-powered map view with price-pill markers, car list sidebar, and detail panel
- **Admin panel** — manage cars and view all bookings
- **Auth** — email/password sign-up and login with Supabase Auth (cookie-based sessions)
- **Image uploads** — car images stored in Supabase Storage
- **Dark/light mode** — via next-themes

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) (Postgres, Auth, Storage)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [lucide-react](https://lucide.dev)

## Getting Started

1. **Create a Supabase project** at [database.new](https://database.new)

2. **Clone the repo and install dependencies**

   ```bash
   git clone <repo-url>
   cd car_rental_test
   npm install
   ```

3. **Set up environment variables** — create `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
   ```

4. **Set up the database** — run the following SQL in your Supabase dashboard:

   ```sql
   -- Cars table
   create table cars (
     id bigint primary key generated always as identity,
     owner_id uuid references auth.users not null,
     make text not null,
     model text not null,
     year int not null,
     description text,
     price_per_day numeric not null,
     location text not null,
     seats int not null default 5,
     transmission text not null default 'automatic',
     fuel_type text not null default 'petrol',
     is_insured boolean not null default false,
     insurance_details text,
     status text not null default 'active',
     blocked_dates jsonb default '[]',
     created_at timestamptz default now()
   );

   -- Car images table
   create table car_images (
     id uuid primary key default gen_random_uuid(),
     car_id bigint references cars on delete cascade,
     url text not null,
     "order" int not null default 0,
     created_at timestamptz default now()
   );

   -- Bookings table
   create table bookings (
     id uuid primary key default gen_random_uuid(),
     car_id bigint references cars on delete cascade,
     renter_id uuid references auth.users not null,
     start_date date not null,
     end_date date not null,
     total_price numeric not null,
     status text not null default 'pending',
     created_at timestamptz default now()
   );
   ```

5. **Create a Supabase Storage bucket** named `car-images` and set it to **public**.

6. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx          # Home — hero + featured cars
  cars/
    page.tsx        # Browse & filter cars
    [id]/page.tsx   # Car detail + booking
    new/page.tsx    # Add a new car (owner)
    [id]/edit/      # Edit a car
  map/page.tsx      # Interactive map view
  dashboard/        # User bookings dashboard
  admin/            # Admin panel
  auth/             # Login, sign-up, password reset

components/
  navbar.tsx
  car-card.tsx
  search-bar.tsx
  booking-widget.tsx
  cars-map.tsx
  car-form.tsx
  image-uploader.tsx

lib/
  types.ts          # Car, Booking, UserProfile interfaces
  supabase/         # Server, client, and proxy Supabase clients
```
