# Viva Preparation Guide

The viva is 60% of the mark, and a system you can't explain is marked as if it isn't yours. Work through this file with the code open next to it. For every section, trace the code yourself until you can say it without reading.

---

## 1. Request flow walkthroughs (Explaining your implementation, 20 marks)

### 1.1 Login
1. `LoginScreen` checks the form locally (email regex, password not empty) and shows errors under the inputs.
2. `useAuth().login()` in `context/AuthContext.js` calls `authApi.login()` in `api/index.js`, which calls `request()` in `api/client.js`: `POST {API_URL}/api/auth/login` with a JSON body.
3. Backend: `app.js` → `routes/authRoutes.js` → `loginRules` (express-validator) → `validate` middleware (400 if invalid) → `authController.login`.
4. `User.findOne({ email }).select('+password')`. The password has `select:false`, so it has to be requested explicitly. `user.matchPassword()` runs `bcrypt.compare`.
5. On success the server signs a JWT with `jwt.sign({ id }, JWT_SECRET, { expiresIn })` and returns `{ token, user }`.
6. The app saves the token with `expo-secure-store` (`utils/tokenStorage.js`), calls `setAuthToken(token)` so every later request sends `Authorization: Bearer ...`, and calls `setUser(user)`.
7. `AppNavigator` sees `user` is set and renders the protected screens instead of Login/Register.

### 1.2 App restart (staying logged in)
In `AuthProvider`, `useEffect` runs `getToken()`. If a token exists, it calls `GET /api/auth/me`. A 200 means the user is restored. A 401 (expired or invalid) calls `logout()`, which deletes the token. While this runs, `booting = true` and a loading screen is shown.

### 1.3 A protected request
`middleware/auth.js → protect`:
- No `Bearer` header → **401**.
- `jwt.verify` throws (bad signature or expired) → **401**.
- The user in the token no longer exists → **401**.
- Otherwise `req.user = user` and `next()`.

`adminOnly` runs after `protect` and returns **403** if `!req.user.isAdmin`.
401 means "we don't know who you are". 403 means "we know who you are, but you're not allowed".

### 1.4 Placing an order (the most important flow)
1. `CartScreen` validates the address and sends **only** `{ items: [{menuItem, quantity}], deliveryAddress, notes }`. It never sends a price.
2. `orderValidators.createRules` checks items is an array of 1–20, each `menuItem` is a Mongo id, and each quantity is an integer from 1 to 20.
3. `orderController.createOrder`:
   - `mergeLines()` merges duplicate lines.
   - `reserveAll(lines)` in `utils/stock.js` calls `reserveStock()` for each line:
     ```js
     MenuItem.findOneAndUpdate(
       { _id, isAvailable: true, stockQuantity: { $gte: quantity } },
       { $inc: { stockQuantity: -quantity } }, { new: true })
     ```
     The **check and the decrement are a single atomic operation**, so two customers can't both get the last portion. If it returns `null`, the function finds out why (404 / unavailable / not enough) and throws a **409**.
   - If stock reaches 0, it sets `isAvailable = false`.
   - If any line fails, the lines already reserved are **released** (rollback), so the order is all-or-nothing.
   - Each line stores `name`, `unitPrice`, `quantity` and `subtotal` copied from the DB, and `totalAmount` is the sum of subtotals.
   - `Order.create(...)` runs with status `Pending` and `statusHistory: [{status:'Pending'}]`. If saving fails, the stock is released.
4. The response is **201**. The app clears the cart and navigates to `OrderDetail`.

### 1.5 Admin changes an order's status
`PATCH /api/orders/:id/status { status }` → `protect` → `adminOnly` → validator (status must be in the enum) → `updateOrderStatus`:
`Order.TRANSITIONS[current].includes(next)`, and otherwise **409**. If the new status is `Cancelled`, `releaseAll(order.items)` runs. Then the status is pushed to `statusHistory` and saved.

### 1.6 Image upload
1. `MenuFormScreen` uses `expo-image-picker` and checks type (jpeg/png/webp) and size (2 MB or less) on the phone.
2. `menuApi.create()` builds `FormData` with the text fields plus `image: { uri, name, type }`. No Content-Type is set, so fetch adds the multipart boundary itself.
3. Route: `protect → adminOnly → upload → createRules → validate → createMenuItem`. `upload` must come **before** the validators, because Multer is what fills `req.body` for multipart requests.
4. `middleware/upload.js` uses `multer.memoryStorage()`, the `fileFilter` (wrong type → 400), and `limits.fileSize` (too big → `LIMIT_FILE_SIZE` → the error handler returns 400).
5. The controller stores `{ data: req.file.buffer, contentType }` in the MenuItem document. `imageUrl` is a Mongoose **virtual**, `/api/menu/<id>/image?v=<updatedAt>`, and `toJSON` removes the raw bytes.
6. The app renders `<Image source={{ uri: API_URL + imageUrl }} />`. The `?v=` changes after an edit, so the phone doesn't show a cached old image.

---

## 2. Design decisions (System design decisions, 10 marks)

| Decision | Why |
|---|---|
| MenuItem = primary, Order = related | An order only makes sense in terms of menu items (`items[].menuItem` ref). |
| Order items are **embedded** sub-documents, not a third collection | They are never used without their order. Embedding reads one document, and the brief caps us at two entities. |
| Copy `name` and `unitPrice` into each line | If the admin changes the price tomorrow, yesterday's receipt must not change. The `ref` is still kept for the relationship. |
| Server calculates totals | The client can't be trusted. Someone could send `totalAmount: 1`, which the test proved is ignored. |
| `stockQuantity` + atomic `$inc` with a condition | Stops overselling under concurrent orders without needing transactions. |
| Status transition map | Keeps the order lifecycle honest (you can't jump from Pending to Completed). Easy to show and explain. |
| Images in MongoDB, not on disk | Render's disk is **ephemeral** and is wiped on each deploy/restart, so files saved to `/uploads` would disappear. Mongo keeps them with no extra service. Limit is 2 MB against a 16 MB document limit. |
| `isAdmin` boolean + `adminOnly` | The brief says one boolean and one middleware check is enough. Admins can't be created via register (the field is ignored). |
| Routes / controllers / models / middleware / validators | Each layer has one job: routes wire the URL, validators reject bad input, controllers hold logic, models define the shape. |
| `asyncHandler` + central `errorHandler` | No try/catch in every controller. Every error becomes JSON with the right status code. |
| `PUT` for full edit, `PATCH` for status/cancel | PATCH changes one aspect of the resource. |
| JWT stored in SecureStore | Encrypted keystore on the phone, rather than plain AsyncStorage. |

---

## 3. Backend and database concepts (10 marks): quick answers

- **Schema vs model:** a schema defines the shape and rules. `mongoose.model('Order', schema)` compiles it into a class that talks to the `orders` collection.
- **Reference:** `{ type: ObjectId, ref: 'MenuItem' }` stores the `_id`. `.populate('user','name email')` replaces the id with the document when reading.
- **Middleware:** a function `(req,res,next)` that runs in order before the controller. Used here for auth, upload, validation and errors.
- **`pre('save')` hook:** hashes the password only if `isModified('password')`, so it isn't hashed twice when you update the name.
- **bcrypt salt:** random data mixed into the hash, so two identical passwords give different hashes. Cost factor 10.
- **JWT parts:** header.payload.signature. The payload (`{id, iat, exp}`) is only base64 and **not encrypted**, so no secrets go in it. The signature proves it wasn't changed.
- **Status codes used:** 200 OK, 201 Created, 400 Bad input, 401 Not authenticated, 403 Forbidden, 404 Not found, 409 Conflict (business rule broken), 500 Server error.
- **Why 409 for "out of stock"?** The request is well-formed (not 400), but it conflicts with the current state of the resource.
- **CastError:** an invalid ObjectId in the URL. The `isMongoId()` validator catches it first, and errorHandler also maps it to 400.
- **Duplicate key 11000:** the unique `email` or menu `name`, mapped to 409.

---

## 4. Mobile and API interaction (10 marks)

- **State:** `useState` for local screen state. `AuthContext` for user and token (global). `CartContext` for the cart (global, in memory).
- **Hooks used:** `useState`, `useEffect` (load on mount), `useCallback`, `useMemo`, `useContext`, `useLayoutEffect` (header button), and `useFocusEffect` from React Navigation (reload when the screen comes back into view, e.g. after editing).
- **Navigation:** `AppNavigator` renders **either** the auth stack **or** the protected stack depending on `user`, which is what makes it a protected area. Tabs are nested inside a native stack, so detail screens slide over the tabs.
- **Token handling:** `client.js` keeps the token in a module variable and adds the header to every request. On a **401** it calls the registered `onUnauthorized` → `logout()`.
- **Loading / empty / error:** every list shows `LoadingView` first, `EmptyState` when the array is empty, and `ErrorView` with *Try again* if the fetch throws.
- **Why `EXPO_PUBLIC_` prefix?** Expo only puts env vars with that prefix into the app bundle. It's public, so never put secrets there.
- **Why not `localhost` in the app?** On the phone, `localhost` is the phone itself. The app must call the Render URL.

---

## 5. "What if…" questions (Problem solving, 10 marks)

| Question | Answer / what to change |
|---|---|
| Two people order the last portion at the same moment? | The conditional `findOneAndUpdate` is atomic. One matches `stockQuantity >= 1`, and the other gets `null` → 409. |
| An order has 3 items and the 3rd is out of stock? | `reserveAll` releases the first two → nothing changes → 409 with the item's name. |
| Admin changes a price after I ordered? | My order keeps `unitPrice` from order time. New lines added while editing use the new price. |
| Token expires while using the app? | Next request → 401 → `onUnauthorized` → logout → Login screen. |
| Someone sends `isAdmin: true` to register? | The controller only reads name/email/phone/password, so it's ignored. |
| Customer calls `PATCH /status` directly with Postman? | `adminOnly` → 403. |
| Upload a 5 MB image or a PDF? | Multer `limits` → 400 "Image must be 2 MB or smaller". `fileFilter` → 400 "Only JPEG, PNG or WEBP". |
| Delete a menu item that is in a Preparing order? | 409. The admin should mark it unavailable instead. |
| "Add a maximum of 5 active orders per customer" (live change) | In `createOrder`, before reserving: `const n = await Order.countDocuments({ user: req.user._id, status: { $in: ['Pending','Preparing','Ready'] } }); if (n >= 5) throw new ApiError(409, 'Too many active orders');` |
| "Add a delivery fee of Rs. 200 for orders under Rs. 2000" | Add `deliveryFee` to the Order schema. In `calculateTotal` (or after it), compute `fee = subtotal < 2000 ? 200 : 0` and `totalAmount = subtotal + fee`. Show it in `OrderDetailScreen`. |
| "Let customers rate a completed order" | Add `rating: {type:Number,min:1,max:5}` to Order, plus `PATCH /:id/rating` allowed only if owner and `status === 'Completed'`. |
| Render sleeping at the demo? | The first request takes about 50 s. Open `/api/health` beforehand. |
| Atlas connection fails on Render? | Check that Network Access allows `0.0.0.0/0`, that `MONGO_URI` has the correct password (URL-encode special characters) and database name. Then check the Render logs. |
| Why not a transaction? | Transactions need a replica set and are harder to explain. Conditional atomic updates plus compensation (release) are enough for a single-document stock counter. |

---

## 6. Practice checklist
- [ ] Draw the architecture and the schema from memory.
- [ ] Explain every file in `backend/src` in one sentence.
- [ ] Walk through `reserveStock` line by line.
- [ ] Show in Postman: 401 without token, 403 as customer, 409 out of stock, 400 bad input.
- [ ] Make one live change from section 5 in under 5 minutes.
- [ ] Demo on a real phone against the Render URL (not localhost).
