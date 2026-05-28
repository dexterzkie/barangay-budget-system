# Task List: Registration, User Management & AI Features

- `[/]` **1. Backend**
  - `[ ]` Update Prisma schema (add fields to User: firstName, lastName, email, contactNumber, address, status)
  - `[ ]` Run migration
  - `[ ]` Update seed file
  - `[ ]` Add POST /api/auth/register route
  - `[ ]` Add GET /api/users (Captain only)
  - `[ ]` Add PATCH /api/users/:id/status (Captain only - approve/reject)
  - `[ ]` Add GET /api/ai/forecast route
  - `[ ]` Add POST /api/ai/generate-document route
  - `[ ]` Add POST /api/ai/generate-monitoring route

- `[ ]` **2. Frontend - Auth**
  - `[ ]` Create RegisterPage.vue (self-registration form)
  - `[ ]` Add register link to LoginPage.vue

- `[ ]` **3. Frontend - User Management**
  - `[ ]` Create UserManagementPage.vue (Captain only)
  - `[ ]` Add to router + sidebar

- `[ ]` **4. Frontend - AI Page**
  - `[ ]` Create AIPage.vue with forecast + document generation
  - `[ ]` Add to router + sidebar
