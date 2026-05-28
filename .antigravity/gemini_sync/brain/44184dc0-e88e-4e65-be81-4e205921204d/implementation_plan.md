# Barangay Pagawan Budget System - Full Stack Implementation

## Goal Description

Transform the static "Barangay Pagawan Budget System" HTML dashboard into a fully functional full-stack web application. The application will allow users to view, add, and manage budget allocations, record expenditures, and dynamically calculate dashboard statistics.

## User Review Required

Please review the updated technology stack (Vue.js + Express). If this looks good, we will begin execution!

## Proposed Tech Stack

*   **Frontend**: Vue.js 3 (using Vite for fast builds). We will adapt your existing Vanilla CSS into Vue Single File Components to preserve your exact design.
*   **Backend**: Node.js with Express.js for the REST API.
*   **Database**: SQLite (via `sqlite3` or `better-sqlite3` and Prisma ORM or standard queries) - Lightweight, file-based database perfect for local development and straightforward deployment without needing to install an external database server.

## Proposed Data Models

Instead of hardcoding the table data, we will define a database schema. *Expended, Balance, and Utilization rate* will be dynamically calculated based on the expenditures recorded against a specific fund.

1.  **FundAllocation**
    *   `id`: Integer (Primary Key)
    *   `fundType`: String (e.g., "General Fund", "Special Education Fund")
    *   `allocatedAmount`: Float
    *   `status`: String (e.g., "Approved", "Pending")

2.  **Expenditure**
    *   `id`: Integer (Primary Key)
    *   `date`: Date
    *   `referenceNo`: String (e.g., "EXP-2025-112")
    *   `description`: String
    *   `amount`: Float
    *   `status`: String
    *   `fundAllocationId`: Integer (Foreign Key linking this expenditure to a specific fund)

## Proposed Changes

### 1. Project Structure
We will create a monolithic repository with two main folders:
- `frontend/` - Vue.js application.
- `backend/` - Express.js API.

### 2. Backend (Express.js API)
- **Database setup**: Initialize SQLite database with Prisma ORM.
- **Routes**:
  - `GET /api/allocations`: Fetch all budget allocations.
  - `POST /api/allocations`: Add a new budget allocation.
  - `GET /api/expenditures`: Fetch all recent expenditures.
  - `POST /api/expenditures`: Record a new expenditure.
  - `GET /api/dashboard`: Calculate top-level stats (Total Budget, Total Expended, Overall Balance).

### 3. Frontend Architecture (Vue Components)
- `App.vue`: Main layout including the Sidebar and main content area.
- `components/DashboardStats.vue`: Display top-level metric cards.
- `components/AllocationsView.vue`: The table showing funds, progress bars, and an "Add Allocation" modal form.
- `components/ExpendituresView.vue`: The table showing recent expenses and a "Record Expenditure" modal form.

## Verification Plan

1.  **System Setup**: Initialize Vue.js and Express.js projects. Install required dependencies.
2.  **Seeding**: Seed the SQLite database with the initial dummy data from your provided HTML file.
3.  **Manual Verification**: 
    *   Launch both backend and frontend development servers.
    *   Verify the UI matches the original aesthetic perfectly.
    *   Test adding a new expenditure and observe the progress bars, balance, and utilization rates update correctly by making requests to the Express API.
