# zindo-frontend

React + TypeScript SPA for Zindo, a tutoring academy management system. Manages students, their textbook assignments (Sheets), and daily learning records.

## Tech Stack

- **Framework:** React 19 + TypeScript, Vite 7
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix UI)
- **Routing:** React Router v7 (lazy-loaded pages)
- **Forms:** react-hook-form + zod
- **HTTP:** Axios
- **Barcode:** ZXing (EAN-13)

## Getting Started

```bash
npm install
npm run dev       # https://localhost:5173
npm run build     # type-check + build
npm run lint
```

**Environment** — create `.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

> The dev server runs on **HTTPS** (required for the barcode scanner's `getUserMedia` API).

## Project Structure

```
src/
├── App.tsx                  # Routes
├── lib/
│   ├── api.ts               # Axios instance
│   └── usePullToRefresh.ts
├── components/
│   ├── layout/              # BaseLayOut, TopBar, BottomNav
│   ├── types/               # Domain types (student, textbook, sheet, record)
│   └── ui/                  # shadcn/ui primitives — avoid editing
└── pages/
    ├── Students/
    ├── Sheets/              # Includes barcode scanner (SheetAdd.tsx)
    └── Records/
```

Path alias `@` resolves to `src/`.

## Routes

| Path | Page |
|---|---|
| `/` | Home |
| `/student` | Student list |
| `/student/new` | Add student |
| `/student/:id/edit` | Edit student |
| `/sheet` | Sheet list |
| `/sheet/new` | Add sheet (barcode scanner) |
| `/record` | Record list |
| `/record/new` | Add record |
| `/record/:id/edit` | Edit record |

## Branch Strategy

- **`dev`** — active development; all work goes here
- **`main`** — production; push to `main` triggers GitHub Actions deploy via rsync
