# Barangay Pagawan Budget System - Walkthrough

The Barangay Pagawan Budget System has been successfully transformed from a static HTML file into a fully functional full-stack web application! 

## Changes Made
- **Backend (Node/Express)**: Set up an Express API connected to a local SQLite database via Prisma ORM. 
- **Database (SQLite)**: Created a robust schema with relational mapping between Fund Allocations and Expenditures. Pre-seeded the database with your initial dummy data.
- **Frontend (Vue.js)**: Scaffoled a Vue 3 application using Vite. Componentized the layout into `DashboardView`, `AllocationsView`, `ExpendituresView`, and `DashboardStats`.
- **Design & Styling**: Kept your Vanilla CSS approach and enhanced it with a premium aesthetic (modern 'Inter' typography, subtle micro-animations, glassmorphism UI cards, and responsive layouts).

## How to View

The frontend and backend development servers are now running.

1.  **View the Application**: Open `http://localhost:5173` in your browser.
2.  **View the Raw API**: Open `http://localhost:3001/api/dashboard` in your browser to verify the backend is running.

## Validation & Testing
You can now fully interact with the dynamic dashboard:
- **Test Allocations**: Click the **"Add Allocation"** button to create a new fund allocation. The new fund will appear immediately in the table.
- **Test Expenditures**: Click **"Record Expenditure"** to record an expense against a specific fund. Watch the dynamic *Total Expended*, *Balance*, and *Utilization Rate* update in real-time across both the statistics cards and the table progress bars!
