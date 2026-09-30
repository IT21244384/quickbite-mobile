# QuickBite API – Endpoint Table

Base URL: `https://<your-service>.onrender.com`. All bodies are JSON unless marked *multipart*.
Auth levels: **Public**, **User** (any valid JWT in `Authorization: Bearer <token>`), **Admin** (JWT and `isAdmin = true`).

| # | Method | Endpoint | Auth | Purpose | Success | Main errors |
|---|--------|----------|------|---------|---------|-------------|
| 1 | GET | `/api/health` | Public | Health check for hosting | 200 | – |
| 2 | POST | `/api/auth/register` | Public | Create account, returns token + user | 201 | 400 validation, 409 email exists |
| 3 | POST | `/api/auth/login` | Public | Log in, returns token + user | 200 | 400, 401 wrong credentials |
| 4 | GET | `/api/auth/me` | User | Current user from token | 200 | 401 |
| 5 | GET | `/api/menu?category=&search=&available=` | User | List / filter menu items | 200 | 400, 401 |
| 6 | GET | `/api/menu/categories` | User | Allowed categories | 200 | 401 |
| 7 | GET | `/api/menu/:id` | User | One menu item | 200 | 400 bad id, 404 |
| 8 | GET | `/api/menu/:id/image` | Public | Image bytes for `<Image>` | 200 | 404 |
| 9 | POST | `/api/menu` *(multipart)* | Admin | Create item (+ optional `image`) | 201 | 400 validation / bad file, 403, 409 duplicate name |
| 10 | PUT | `/api/menu/:id` *(multipart)* | Admin | Update any fields / replace image | 200 | 400, 403, 404 |
| 11 | DELETE | `/api/menu/:id` | Admin | Delete item | 200 | 403, 404, 409 in active order |
| 12 | POST | `/api/orders` | User | Place order `{items:[{menuItem,quantity}], deliveryAddress, notes}` | 201 | 400, 404 item gone, 409 out of stock / unavailable |
| 13 | GET | `/api/orders?status=` | User | Own orders (admin: all orders) | 200 | 400, 401 |
| 14 | GET | `/api/orders/:id` | User | One order (owner or admin) | 200 | 403, 404 |
| 15 | PUT | `/api/orders/:id` | User (owner) | Edit items / address / notes while Pending | 200 | 403, 409 not Pending / out of stock |
| 16 | PATCH | `/api/orders/:id/cancel` | User (owner) | Cancel a Pending order, stock returned | 200 | 403, 409 |
| 17 | PATCH | `/api/orders/:id/status` | Admin | Move status `{status}` along workflow | 200 | 400, 403, 409 invalid transition |
| 18 | DELETE | `/api/orders/:id` | User (owner) / Admin | Delete Pending (stock returned), Cancelled or Completed order | 200 | 403, 404, 409 Preparing/Ready |

Errors always look like `{ "message": "...", "details": [{ "field": "...", "message": "..." }] }` (`details` only for validation errors).
