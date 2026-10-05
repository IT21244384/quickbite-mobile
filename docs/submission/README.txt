SE2020 - Web and Mobile Technologies
Individual Assignment - Full Stack Mobile Application
QuickBite - Food Ordering Mobile Application

01). GitHub Repository Link
GitHub Repository: https://github.com/IT21244384/quickbite-mobile

02). Student Details (individual assignment)
Group Number: N/A - Individual submission
Student: IT21244384 - Abisheak S
Scope: Full system - Authentication, Menu Management (primary entity),
       Order Management (related entity), Mobile Application, Deployment

03). Deployment Details
Backend URL: https://quickbite-api-three.vercel.app
Health check: https://quickbite-api-three.vercel.app/api/health
Database: MongoDB Atlas (free M0 cluster, AWS Mumbai, database "quickbite")
Hosting note: Render was the first target and render.yaml remains in the repository,
       but its Blueprint flow requires a payment card, so the API was moved to
       Vercel's free tier. backend/api/index.js exports the Express app as a
       serverless function and backend/vercel.json routes every path to it.

Environment variables configured (values redacted):
  Backend (Vercel): MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN
  Backend (local only): ADMIN_EMAIL, ADMIN_PASSWORD (used by npm run seed:admin)
  Mobile: EXPO_PUBLIC_API_URL (hosted base URL, without a trailing /api)

04). Tech Stack
Mobile:   React Native (Expo SDK 57), React Navigation, expo-secure-store, expo-image-picker
Backend:  Node.js, Express 4, Mongoose 8, JWT, bcryptjs, Multer, express-validator
Database: MongoDB Atlas
Hosting:  Vercel (serverless)
Tools:    VS Code, Git, GitHub, Expo Go on a physical Android device

05). Entities
MenuItem (primary) - full CRUD + image upload, stored in MongoDB and served at
                     GET /api/menu/:id/image
Order (related)    - references User and MenuItem, full CRUD, status workflow
                     Pending -> Preparing -> Ready -> Completed (Cancelled allowed
                     from Pending or Preparing)
Business logic     - server-side total calculation, atomic stock reservation and
                     release, automatic sold-out handling, status transition rules

06). Repository Structure
backend/   - Express API (routes, controllers, models, middleware, validators, utils)
mobile/    - React Native (Expo) application
docs/      - Report, diagrams, API endpoint table, viva guide

07). Files in this ZIP
Problem_Statement.pdf
System_Architecture_Diagram.png
Database_Schema_Diagram.png
API_Endpoint_Table.pdf
Team_Responsibility.pdf
QuickBite_Report.pdf
README.txt

08). Declaration of AI tool usage
AI assistance (Claude Code) was used during development. Section 10 of
QuickBite_Report.pdf records what it was used for.
