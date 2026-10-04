SE2020 - Web and Mobile Technologies
Individual Assignment - Full Stack Mobile Application
QuickBite - Food Ordering Mobile Application

01). GitHub Repository Link
GitHub Repository: https://github.com/IT21244384/quickbite-mobile

02). Student Details (individual assignment)
Group Number: N/A - Individual
Member 1: IT21244384 - Abisheak S - Full system (Authentication, Menu Management, Order Management, Mobile App, Deployment)

03). Deployment Details
Backend URL: https://<your-service>.onrender.com
Health check: https://<your-service>.onrender.com/api/health
Database: MongoDB Atlas (M0 cluster, database "quickbite")

Environment variables configured (values redacted):
  Backend (Render): MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV, PORT (set by Render)
  Backend (local only): ADMIN_EMAIL, ADMIN_PASSWORD (used by npm run seed:admin)
  Mobile: EXPO_PUBLIC_API_URL

04). Tech Stack
Mobile: React Native (Expo SDK 57) | Backend: Node.js + Express | Database: MongoDB Atlas | Hosting: Render

05). Repository Structure
backend/   - Express API (routes, controllers, models, middleware, validators, utils)
mobile/    - React Native (Expo) app
docs/      - Report, diagrams, API table

06). Files in this ZIP
Problem_Statement.pdf
System_Architecture_Diagram.png
Database_Schema_Diagram.png
API_Endpoint_Table.pdf
Team_Responsibility.pdf
README.txt
