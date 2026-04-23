# SQLite CRUD Project

Жоба енді екі бөлікке бөлінді:

- `frontend/` — React + Vite интерфейсі
- `backend/` — Express + SQLite REST API

## Іске қосу

1. Backend:
   `cd backend`
   `npm run dev`

2. Frontend:
   `cd frontend`
   `npm run dev`

## Әдепкі админ

- Email: `admin@sqlstudy.kz`
- Құпиясөз: `admin123`

## Бұл жобада не бар

- SQLite дерекқоры және бірнеше кесте: `users`, `courses`, `lessons`, `enrollments`, `course_likes`
- Байланыстар: `1:1` (`courses` -> `lessons`) және `N:M` (`users` <-> `courses`)
- REST API: `GET`, `POST`, `PUT`, `DELETE`
- React формалары: тіркелу, кіру, курс қосу/өңдеу/жою, сабақ өңдеу
- Іздеу, pagination, loading, confirm, toast хабарламалар
- Парольді `bcrypt` арқылы хэштеу
- Серверлік және фронтендтік валидация
New feature added
