# Trip Manager

A trip planning application for organizing travel plans, discovering attractions, and creating day-by-day itineraries.

## Features

- **Trip Management**: Create and manage your travel plans with start/end dates
- **Attractions**: Discover and save places to visit with location data
- **Itineraries**: Build day-by-day schedules for your trips
- **Maps**: Visualize attractions and routes on interactive maps
- **PDF Export**: Generate printable itinerary documents

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [Drizzle](https://orm.drizzle.team) - TypeScript ORM
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Clerk](https://clerk.com) - Authentication

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables (copy `.env.example` to `.env`)

3. Run the development server:
   ```bash
   pnpm dev
   ```

## Useful database scripts

### Create dump

```bash
turso auth login
turso db shell trips .dump > ./dumps/trips-dump.sql
```

### Import from dump

```bash
turso db create trips
turso db shell geography < ./dumps/geography-dump.sql
turso db shell trips < ./dumps/trips-dump.sql
turso db tokens create trips
```
