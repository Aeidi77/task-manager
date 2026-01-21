# 📝 Task Manager App

A modern **Task Management Application** built with **Next.js (App Router)**, **Prisma ORM**, and **PostgreSQL**. This app supports **authentication**, **task ownership**, **collaboration**, and **role-based access control** (owner vs collaborator).

---

## 🚀 Features

* ✅ User Authentication (Login / Logout)
* 🧑‍💼 Task Ownership (Creator)
* 🤝 Task Collaboration (Collaborators)
* 🔐 Authorization Rules

  * Task **owner** can update & delete all tasks
  * User can only update/delete **their own tasks**
* 📋 Task List Management
* 🗑 Soft Delete / Hard Delete (configurable)
* ⚡ Built with Next.js App Router

---

## 🧰 Tech Stack

* **Frontend & Backend**: Next.js 14 (App Router)
* **Database**: PostgreSQL
* **ORM**: Prisma
* **Auth**: Custom session / middleware-based auth
* **Package Manager**: pnpm

## 📁 Project Structure

```
task-manager/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   └── tasks/
│   │   │       └── [id]/route.ts
│   │   └── page.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── auth.ts
│   └── types/
├── .env
├── package.json
└── README.md
```

---

## ⚙️ Prerequisites

Make sure you have the following installed:

* **Node.js** >= 18
* **pnpm** >= 8
* **PostgreSQL**

---

## 🛠 Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Aeidi77/task-manager.git
cd task-manager
```

### 2️⃣ Install Dependencies

```bash
pnpm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/task_manager"
NEXTAUTH_SECRET="your-secret-key"
```

> ⚠️ Replace `USER`, `PASSWORD`, and database name accordingly.

---

## 🧬 Database Setup

### 1️⃣ Generate Prisma Client

```bash
pnpm prisma generate
```

### 2️⃣ Run Migrations

```bash
pnpm prisma migrate dev
```

### 3️⃣ (Optional) Open Prisma Studio

```bash
pnpm prisma studio
```

---

## ▶️ Running the App

### Development Mode

```bash
pnpm dev
```

App will be running at:

```
http://localhost:3000
```

---

## 🔁 API Endpoints (Example)

### 🔹 Update Task

```
PATCH /api/tasks/:id
```

Rules:

* Owner → can update all tasks
* User → can update their own tasks only

### 🔹 Delete Task

```
DELETE /api/tasks/:id
```

Rules:

* Owner → can delete all tasks
* User → can delete their own tasks only

---

## 🔒 Authorization Logic (Summary)

```ts
const isOwner = task.taskList.ownerId === user.userId
const isTaskCreator = task.createdById === user.userId

if (!isOwner && !isTaskCreator) {
  throw new Error('Forbidden')
}
```

---

## 🧪 Common Issues

### ❌ Prisma error: `id: undefined`

Cause:

* `params.id` not awaited in App Router

Solution:

```ts
export async function PATCH(req, context) {
  const { id } = await context.params
}
```

---

## 📌 Scripts

```bash
pnpm dev         # Run development server
pnpm build       # Build production app
pnpm start       # Start production server
pnpm prisma      # Prisma CLI
```
## Create and Start docker
```bash
docker-compose create
docker-compose start
```

---

## 🤝 Contributing

Pull requests are welcome!

1. Fork the repo
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT License © 2026

---

## 🙌 Author

**Aeidi Muttaqin**

---

If you have questions or want to extend this project (roles, RBAC, audit log, etc.), feel free to ask 🚀
