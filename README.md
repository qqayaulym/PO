# SQL Study Hub

Жоба екі бөлікке бөлінген:

- `frontend/` — React + Vite интерфейсі
- `backend/` — Express REST API

Енді дерекқор `SQLite` емес, `Supabase Postgres`.

## Іске қосу

1. `Supabase` ішінде [backend/supabase/schema.sql](/C:/Users/Газиза/Desktop/PO/backend/supabase/schema.sql) файлын SQL Editor-ға қойып іске қосыңыз.
2. `backend/.env` файлына мыналарды жазыңыз:

```env
PORT=4000
SUPABASE_URL=https://mogfxnhispeeedqyfewh.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Ескерту:
Backend кодында `VITE_SUPABASE_URL` және `VITE_SUPABASE_PUBLISHABLE_KEY` мәндері де fallback ретінде қолданылады, бірақ сервер үшін `SUPABASE_*` атаулары түсініктірек.

3. Backend:
   `cd backend`
   `npm install`
   `npm run dev`

4. Frontend:
   `cd frontend`
   `npm install`
   `npm run dev`

## Әдепкі админ

Алғашқы іске қосылғанда, егер база бос болса, сервер мына админді автоматты түрде жасайды:

- Email: `admin@sqlstudy.kz`
- Құпиясөз: `admin123`
