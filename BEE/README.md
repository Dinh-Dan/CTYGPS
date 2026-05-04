# GPS Viet — Backend

## Yeu cau
- Node.js 16.20.x LTS
- MariaDB / MySQL (qua XAMPP, port 3306)

## Chay lan dau
```
cd BE
copy .env.example .env
# Sua .env theo cau hinh thuc te
npm install
npm run dev
```

Server chay tai http://localhost:3000

## Cau truc
```
BE/
  server.js              -> entry point
  package.json
  .env.example
  src/
    db.js                -> mysql2 pool
    middleware/
      auth.js            -> verifyToken, requireRole
    routes/
      auth.js            -> /api/auth/{login, refresh, logout}
      admin.js           -> /api/admin/*
      customer.js        -> /api/customer/* (chung cho khach le va dai ly)
      kithuat.js         -> /api/kithuat/*
```

## Kiem tra
- `GET /api/health` — ping server + DB
- `GET /api/admin/ping` — yeu cau JWT role=admin (chua co user de test, lam o turn sau)
