# QuickBite – Food Ordering Mobile App

SE2020 Web and Mobile Technologies – Individual Assignment (Y2S2 2026)
Abisheak S – IT21244384

A full-stack mobile app where customers browse a menu, place food orders, and track them, while an admin manages the menu and moves orders through the kitchen.

| Layer    | Technology |
|----------|------------|
| Mobile   | React Native (Expo SDK 57), React Navigation, expo-secure-store, expo-image-picker |
| Backend  | Node.js, Express 4, Mongoose 8, JWT, bcryptjs, Multer, express-validator |
| Database | MongoDB Atlas |
| Hosting  | Render (web service) |

**Live API:** `https://<your-service>.onrender.com` (health check: `/api/health`)

## Entities

- **MenuItem (primary):** name, description, category, price, stockQuantity, isAvailable, image. Full CRUD, and an image upload that is stored in MongoDB.
- **Order (related):** user → User, items[].menuItem → MenuItem, quantities, unit prices, totalAmount, deliveryAddress, notes, status, statusHistory. Full CRUD plus status changes.
- **User:** name, email, phone, password (bcrypt hash), isAdmin.

## Business rules (enforced by the API, not the database)

1. **Total is calculated on the server** from stored menu prices. The app sends only item IDs and quantities.
2. **Stock check and reservation:** an order is refused (409) if an item is unavailable or doesn't have enough portions. Stock is decremented atomically, and a multi-item order is all-or-nothing (reserved lines are rolled back if any line fails).
3. **Auto sold-out:** when stock reaches 0 the item becomes unavailable. Cancelling or deleting a Pending order returns the portions and makes the item available again.
4. **Status workflow:** Pending → Preparing → Ready → Completed, with Cancelled allowed from Pending or Preparing. Any other change is refused (409). Customers can edit or cancel only while the order is Pending.
5. **Editing a Pending order** reserves or releases only the difference in quantities and recalculates the total. Existing lines keep the price the customer originally saw.
6. A menu item that appears in an active order can't be deleted (409).

## Running locally

```bash
# backend
cd backend
cp .env.example .env        # fill in MONGO_URI and JWT_SECRET
npm install
npm run seed:admin          # creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev

# mobile
cd mobile
cp .env.example .env        # EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com
npm install
npx expo start              # scan the QR code with Expo Go
```

## Environment variables (values redacted)

| Where   | Name | Purpose |
|---------|------|---------|
| backend | `MONGO_URI` | MongoDB Atlas connection string |
| backend | `JWT_SECRET` | Secret used to sign JWTs |
| backend | `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| backend | `PORT` | Set automatically by Render |
| backend | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used only by `npm run seed:admin` |
| mobile  | `EXPO_PUBLIC_API_URL` | Base URL of the hosted API |

## Deployment (Render + Atlas)

1. **Atlas:** create a free M0 cluster, add a database user, and under *Network Access* allow `0.0.0.0/0` (Render has no fixed IP). Copy the connection string and add `/quickbite` as the database name.
2. **Render:** New → Blueprint → select this repo. `render.yaml` creates the `quickbite-api` service (root `backend`, `npm install`, `npm start`). Enter `MONGO_URI` when prompted; `JWT_SECRET` is generated.
3. Open `https://<service>.onrender.com/api/health` and expect `{"status":"ok"}`.
4. Run `npm run seed:admin` locally, with `.env` pointing at the Atlas URI, to create the admin.
5. Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to the Render URL and restart Expo with `npx expo start -c`.

On Render's free plan the service sleeps after 15 minutes idle, and the first request after that takes about 50 seconds. Open `/api/health` a minute before a demo.

## Folder structure

```
backend/src
  config/db.js            MongoDB connection
  models/                 User, MenuItem, Order (Mongoose schemas)
  controllers/            auth, menu, order request handlers
  routes/                 URL -> middleware -> controller wiring
  middleware/             auth (protect, adminOnly), upload (Multer), validate, errorHandler
  validators/             express-validator rules per resource
  utils/                  ApiError, asyncHandler, stock (reserve/release), createAdmin
mobile/src
  api/                    fetch wrapper + endpoint functions
  context/                AuthContext (token, user), CartContext
  navigation/             auth stack vs protected tabs + stack
  screens/                auth, menu, cart, orders, profile
  components/ui.js        Button, FormInput, Loading/Empty/Error views, StatusBadge...
```

See [docs/API.md](docs/API.md) for the full endpoint table and [docs/VIVA_GUIDE.md](docs/VIVA_GUIDE.md) for request-flow walkthroughs.
