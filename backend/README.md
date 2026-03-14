<div align="center">

# 🐾 PawMitra Core API

**The robust Backend Engine and WebSocket Server powering the PawMitra ecosystem.**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)

</div>

<br/>

## 📋 Table of Contents
- [About the Project](#-about-the-project)
- [Key Infrastructure](#-key-infrastructure)
- [Technology Stack](#-technology-stack)
- [Database Architecture & Schema](#-database-architecture--schema)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [WebSocket Implementation](#-websocket-implementation)
- [Important Notes](#-important-notes)

---

## 📖 About the Project

The **PawMitra Backend** serves as the central orchestration layer for user authentication, pet data management, community interactions, and real-time connectivity. Built natively with **TypeScript** and **Node.js (ESM)**, it runs an **Express 5** RESTful server side-by-side with a native **WebSocket** server on the same port.

It enforces strict data validation using **Zod** and ensures total relational integrity via **PostgreSQL** mapping managed by the **Prisma ORM**.

---

## ✨ Key Infrastructure

- **🔐 Stateless Authentication:** JWT token-based authentication verified via custom Express middleware. Encrypted credentials via `bcrypt`.
- **⚡ Native WebSockets:** Event-driven real-time system handling Direct Messages, public Chat Rooms, and connection-auth lifecycles.
- **🛡️ Strict Data Validation:** Every incoming HTTP payload and URL parameter is validated against declarative `Zod` schemas.
- **☁️ Cloud Images:** Direct integration with Cloudinary via signed upload signatures preventing heavy payloads through the backend.
- **🗄️ Relational Integrity:** Complex database behaviors like cascading deletes built directly into the schema.
- **📨 Asynchronous Emailing:** Integrated NodeMailer logic for essential OTP communications.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Runtime Engine** | [Node.js v18+ (ESM)](https://nodejs.org/) | High-performance asynchronous execution environment. |
| **Web Framework** | [Express 5](https://expressjs.com/) | Minimalist routing and middleware framework. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript for scalable development. |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Advanced open-source relational database. |
| **ORM** | [Prisma 7](https://www.prisma.io/) | Next-generation Node.js toolkit for database modeling. |
| **Real-Time Comm.**| [ws](https://github.com/websockets/ws) | Fast and thoroughly tested Native WebSocket library. |
| **Schema Validation**| [Zod](https://zod.dev/) | TypeScript-first schema declaration and validation. |
| **Image Storage** | Cloudinary | Asset delivery and signed direct uploading. |
| **Mail Delivery** | Nodemailer | E-mail abstraction library. |
| **Deployment** | Render | Managed cloud hosting platform. |

---

## 🏗️ Database Architecture & Schema

### Entity Relationship
The backend utilizes Prisma to manage relationships efficiently.

```mermaid
erDiagram
    USER ||--o{ PET : "owns & reports"
    USER ||--o{ ADOPTION_REQUEST : "makes"
    PET ||--o{ ADOPTION_REQUEST : "receives"
    USER ||--o{ NOTIFICATION : "gets notified"
    USER ||--o{ MESSAGE : "1:1 communication"
    CHAT_ROOM ||--o{ ROOM_PARTICIPANT : "has members"
    USER ||--o{ ROOM_PARTICIPANT : "joins"
    CHAT_ROOM ||--o{ ROOM_MESSAGE : "holds history"
```

### Enums
- `Role`: `USER`, `ADMIN`
- `Gender`: `MALE`, `FEMALE`, `OTHER`
- `PetStatus`: `LOST`, `FOUND`, `ADOPTED`
- `ValidationStatus`: `PENDING`, `APPROVED`, `REJECTED`
- `PetGender`: `MALE`, `FEMALE`
- `AdoptionStatus`: `PENDING`, `APPROVED`, `REJECTED`

### Models (Brief View)
- **User** — id, name, username, email, password, role, age, gender, phone, location, createdAt, updatedAt
- **Pet** — id, name, type, breed, color, gender, age, wellness, birthmark, imageUrl, imagePublicId, status, validationStatus, state, city, village, addressLine, pincode, googleMapsLink, incidentDate, dateReported, updatedAt, ownerId, adoptedById
- **AdoptionRequest** — id, status, requestDate, updatedAt, userId, petId *(unique: userId+petId)*
- **Notification** — id, message, isRead, timestamp, userId
- **Message** — id, content, isRead, timestamp, senderId, receiverId
- **ChatRoom** — id, name, isDisabled, createdAt, petId
- **RoomParticipant** — id, joinedAt, roomId, userId *(unique: roomId+userId)*
- **RoomMessage** — id, message, timestamp, roomId, senderId

---

## 📁 Project Structure

```text
src/
├── app.ts                    # Express app setup, middleware, routes
├── server.ts                 # HTTP server entry point
├── websocket.ts              # WebSocket server logic
├── controllers/              # Core business logic mapped to HTTP route handlers
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── pet.controller.ts
│   ├── adoption.controller.ts
│   ├── chat.controller.ts
│   ├── notification.controller.ts
│   └── admin.controller.ts
├── routes/                   # HTTP route definitions
│   ├── auth.routes.ts        # (etc...)
├── middlewares/
│   └── auth.middleware.ts    # requireAuth — JWT verification
├── services/                 # Abstractions interacting with 3rd parties or specialized logic
│   ├── email.service.ts      # Nodemailer OTP emails
│   ├── otp.store.ts          # In-memory OTP storage
│   └── cloudinary.service.ts # Signed upload signature
└── validators/
    └── auth.schema.ts        # (etc...) Zod definitions
```

---

## 🚀 Getting Started

Follow these instructions to set up the backend service locally.

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **PostgreSQL** database (Running locally or via cloud like Supabase/Neon).
- **Cloudinary** account

### Installation
```bash
git clone https://github.com/Aryannnn-n/PawMitra.git
cd PawMitra/backend
npm install
```

### Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@host:5432/pawmitra
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your_email_password
EMAIL_FROM=PawMitra <noreply@pawmitra.com>

PORT=3000
```

### Database Setup
Generate the Prisma Client types and sync your schema with Postgres:
```bash
npx prisma migrate dev
npx prisma generate
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

---

## 🌐 API Reference

### Auth Routes

**POST /api/auth/send-verification**
Sends an OTP to the given email for registration verification.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```
**Response Example:**
```json
{
  "msg": "Verification code sent to your email."
}
```
**Status Codes:** 200 OK, 400 Bad Request, 500 Internal Server Error

**POST /api/auth/verify**
Verifies the OTP sent to the email.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```
**Response Example:**
```json
{
  "msg": "Email verified successfully!"
}
```
**Status Codes:** 200 OK, 400 Bad Request, 500 Internal Server Error

**POST /api/auth/register**
Registers a new user after email verification.

**Request Body:**
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "otp": "123456",
  "role": "USER",
  "age": 25,
  "gender": "MALE",
  "phone": "9876543210",
  "location": "New York, NY"
}
```
**Response Example:**
```json
{
  "msg": "Registration successful ✅",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "USER",
    "createdAt": "2023-10-01T12:00:00.000Z"
  }
}
```
**Status Codes:** 201 Created, 400 Bad Request, 403 Forbidden, 409 Conflict, 500 Internal Server Error

**POST /api/auth/login**
Logs in a user and returns a JWT token.

**Request Body:**
```json
{
  "identifier": "john@example.com",
  "password": "securepassword"
}
```
**Response Example:**
```json
{
  "msg": "Login successful ✅",
  "token": "<JWT_TOKEN>",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "USER"
  }
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

**POST /api/auth/logout**
Logs out the user (stateless, client drops token).

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "msg": "Logout successful. Please delete your token client-side."
}
```
**Status Codes:** 200 OK

### User Routes (Requires Auth)

**GET /api/users**
Returns a list of users, with optional filtering.

**Query Parameters:**
- `role=ADMIN` or `role=USER`
- `search=keyword`

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "users": [
    {
      "id": 2,
      "name": "Jane Smith",
      "username": "janesmith",
      "email": "jane@example.com",
      "role": "USER"
    }
  ]
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 500 Internal Server Error

**GET /api/users/me**
Returns the logged-in user’s profile.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "USER",
    "age": 25,
    "gender": "MALE",
    "phone": "9876543210",
    "location": "New York, NY",
    "createdAt": "2023-10-01T12:00:00.000Z"
  }
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

**PUT /api/users/me**
Updates the logged-in user’s profile.

**Headers:** Authorization: Bearer &lt;token&gt;

**Request Body:**
```json
{
  "name": "John Changed",
  "age": 26,
  "location": "Boston, MA"
}
```
**Response Example:**
```json
{
  "msg": "Profile updated successfully ✅",
  "user": {
    "id": 1,
    "name": "John Changed",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "USER",
    "age": 26,
    "gender": "MALE",
    "phone": "9876543210",
    "location": "Boston, MA",
    "createdAt": "2023-10-01T12:00:00.000Z"
  }
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 409 Conflict, 500 Internal Server Error

**PUT /api/users/change-password**
Changes the logged-in user's password.

**Headers:** Authorization: Bearer &lt;token&gt;

**Request Body:**
```json
{
  "currentPassword": "securepassword",
  "newPassword": "newsecurepassword"
}
```
**Response Example:**
```json
{
  "msg": "Password updated successfully 🔑"
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

**DELETE /api/users/me**
Deletes the logged-in user's own account.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "msg": "Account deleted successfully. Sorry to see you go 👋"
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 500 Internal Server Error

**GET /api/users/:id**
Get any user's profile by ID.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "user": {
    "id": 2,
    "name": "Jane Smith",
    "username": "janesmith",
    "email": "jane@example.com",
    "role": "USER",
    "age": 24,
    "gender": "FEMALE",
    "phone": "1234567890",
    "location": "Los Angeles, CA",
    "createdAt": "2023-10-02T12:00:00.000Z"
  }
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### Pet Routes

**GET /api/pets**
Returns a list of the latest 25 APPROVED pets. (No auth needed)

**Response Example:**
```json
{
  "pets": [
    {
      "id": 1,
      "name": "Buddy",
      "type": "Dog",
      "breed": "Golden Retriever",
      "status": "ADOPTABLE"
    }
  ]
}
```
**Status Codes:** 200 OK, 500 Internal Server Error

**GET /api/pets/search**
Search pets with given filters. (No auth needed)

**Query Parameters:**
- `type` (string)
- `breed` (string)
- `color` (string)
- `location` (string)
- `status` (LOST, FOUND, ADOPTABLE, ADOPTED, REUNITED)

**Response Example:**
```json
{
  "pets": [
    {
      "id": 1,
      "name": "Buddy",
      "type": "Dog",
      "status": "ADOPTABLE"
    }
  ]
}
```
**Status Codes:** 200 OK, 500 Internal Server Error

**GET /api/pets/upload-signature**
Returns signed Cloudinary parameters for direct upload.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "signature": "<CLOUDINARY_SIGNATURE>",
  "timestamp": 1696150000
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 500 Internal Server Error

**POST /api/pets**
Report a new pet (lost/found/adoptable).

**Headers:** Authorization: Bearer &lt;token&gt;

**Request Body:**
```json
{
  "name": "Buddy",
  "type": "Dog",
  "breed": "Golden Retriever",
  "color": "Golden",
  "gender": "MALE",
  "age": 2,
  "imageUrl": "https://res.cloudinary.com/.../image.jpg",
  "imagePublicId": "image123",
  "status": "ADOPTABLE",
  "state": "California",
  "city": "Los Angeles"
}
```
**Response Example:**
```json
{
  "msg": "Pet reported successfully. Awaiting validation ✅",
  "pet": {
    "id": 1,
    "name": "Buddy",
    "type": "Dog",
    "validationStatus": "PENDING"
  }
}
```
**Status Codes:** 201 Created, 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

**GET /api/pets/:id**
Get pet details by ID. (No auth needed)

**Response Example:**
```json
{
  "pet": {
    "id": 1,
    "name": "Buddy",
    "type": "Dog",
    "status": "ADOPTABLE"
  }
}
```
**Status Codes:** 200 OK, 400 Bad Request, 404 Not Found, 500 Internal Server Error

**PUT /api/pets/:id**
Update a pet (owner only).

**Headers:** Authorization: Bearer &lt;token&gt;

**Request Body:**
```json
{
  "name": "Buddy Updated"
}
```
**Response Example:**
```json
{
  "msg": "Pet updated successfully ✅",
  "pet": {
    "id": 1,
    "name": "Buddy Updated"
  }
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

**DELETE /api/pets/:id**
Delete a pet (owner or admin).

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "msg": "Pet deleted successfully"
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

### Adoption Routes (Requires Auth)

**POST /api/adoptions/:petId**
Request to adopt a pet.

**Headers:** Authorization: Bearer &lt;token&gt;

**Request Body:**
```json
{
  "message": "I love this dog and want to adopt it!"
}
```
**Response Example:**
```json
{
  "msg": "Adoption request submitted successfully ✅",
  "request": {
    "id": 1,
    "status": "PENDING",
    "petId": 1,
    "userId": 2
  }
}
```
**Status Codes:** 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Server Error

**GET /api/adoptions/my**
Get logged-in user's own adoption requests.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "requests": [
    {
      "id": 1,
      "status": "PENDING",
      "pet": {
        "id": 1,
        "name": "Buddy"
      }
    }
  ],
  "total": 1
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 500 Internal Server Error

**POST /api/adoptions/:id/approve**
Approve an adoption request (admin only). Auto-creates a chat room.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "msg": "Adoption request approved ✅",
  "room": {
    "id": 1,
    "name": "Adoption Chat"
  }
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

**POST /api/adoptions/:id/reject**
Reject an adoption request (admin only).

**Headers:** Authorization: Bearer &lt;token&gt;

**Request Body:**
```json
{
  "reason": "Not a suitable match"
}
```
**Response Example:**
```json
{
  "msg": "Adoption request rejected."
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

### Chat Routes (Requires Auth)

**GET /api/chat/recent-contacts**
Get last 10 distinct DM contacts.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "users": [
    {
      "id": 2,
      "username": "janesmith"
    }
  ]
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 500 Internal Server Error

**GET /api/chat/dm/:userId**
Full DM history between current user and specified user.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "messages": [
    {
      "id": 1,
      "content": "Hello!",
      "timestamp": "2023-10-01T12:00:00.000Z",
      "sender": {
        "id": 2,
        "username": "janesmith"
      }
    }
  ],
  "total": 1
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

**GET /api/chat/rooms**
All chat rooms the current user is part of.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "rooms": [
    {
      "id": 1,
      "name": "Adoption: Buddy",
      "isDisabled": false,
      "participants": []
    }
  ],
  "total": 1
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 500 Internal Server Error

**GET /api/chat/rooms/:roomId**
Full message history for a room.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "room": {
    "id": 1,
    "name": "Adoption: Buddy",
    "messages": [
      {
        "id": 1,
        "message": "Welcome!",
        "timestamp": "2023-10-01T12:00:00.000Z"
      }
    ]
  }
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

### Notification Routes (Requires Auth)

**GET /api/notifications**
Get all notifications (marks all as read).

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "notifications": [
    {
      "id": 1,
      "message": "Welcome to PawMitra!",
      "isRead": true,
      "timestamp": "2023-10-01T12:00:00.000Z"
    }
  ],
  "total": 1
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 500 Internal Server Error

**GET /api/notifications/unread-count**
Get unread notification count.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "count": 5
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 500 Internal Server Error

**PATCH /api/notifications/:id/read**
Mark one notification as read.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "msg": "Notification marked as read"
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

**DELETE /api/notifications/:id**
Delete one notification.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "msg": "Notification deleted"
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

### Admin Routes (Requires Auth, Admin Role)

**GET /api/admin/dashboard**
Get summary stats across the platform.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "users": { "totalUsers": 100, "totalAdmins": 2 },
  "pets": { "totalPets": 50, "lostCount": 10, "foundCount": 10, "adoptableCount": 20, "adoptedCount": 5, "reunitedCount": 5 },
  "validation": { "pendingValidation": 5, "approvedValidation": 50, "rejectedValidation": 2 },
  "adoptions": { "pendingAdoptions": 3, "approvedAdoptions": 10, "rejectedAdoptions": 2 }
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 403 Forbidden, 500 Internal Server Error

**GET /api/admin/pets**
All pets (for table review).

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "pets": [ { "id": 1, "name": "Buddy" } ],
  "total": 1
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 403 Forbidden, 500 Internal Server Error

**PATCH /api/admin/pets/:id/validation**
Approve or reject a pet report.

**Headers:** Authorization: Bearer &lt;token&gt;

**Request Body:**
```json
{
  "validationStatus": "APPROVED"
}
```
**Response Example:**
```json
{
  "msg": "Pet report approved ✅"
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

**PATCH /api/admin/pets/:id/status**
Change pet's lifecycle status.

**Headers:** Authorization: Bearer &lt;token&gt;

**Request Body:**
```json
{
  "status": "APPROVED"
}
```
**Response Example:**
```json
{
  "msg": "Pet status updated to APPROVED"
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

**GET /api/admin/users**
All non-admin users.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "users": [ { "id": 1, "username": "johndoe" } ],
  "total": 1
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 403 Forbidden, 500 Internal Server Error

**DELETE /api/admin/users/:id**
Delete user by ID.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "msg": "User "johndoe" deleted successfully."
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

**GET /api/admin/adoptions**
Get all adoption requests platform-wide.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "requests": [ { "id": 1, "status": "PENDING" } ],
  "total": 1
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 403 Forbidden, 500 Internal Server Error

**POST /api/admin/rooms**
Manually create a chat room.

**Headers:** Authorization: Bearer &lt;token&gt;

**Request Body:**
```json
{
  "name": "General Chat",
  "participantIds": [1, 2]
}
```
**Response Example:**
```json
{
  "msg": "Chat room created ✅",
  "room": { "id": 1, "name": "General Chat" }
}
```
**Status Codes:** 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

**GET /api/admin/rooms**
All chat rooms on platform.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "rooms": [ { "id": 1, "name": "General Chat" } ],
  "total": 1
}
```
**Status Codes:** 200 OK, 401 Unauthorized, 403 Forbidden, 500 Internal Server Error

**PATCH /api/admin/rooms/:id/toggle**
Toggle chat room availability (enable/disable).

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "msg": "Room "General Chat" disabled successfully."
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

**DELETE /api/admin/rooms/:id**
Delete a chat room.

**Headers:** Authorization: Bearer &lt;token&gt;

**Response Example:**
```json
{
  "msg": "Room "General Chat" deleted successfully."
}
```
**Status Codes:** 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

---

## ⚡ WebSocket Implementation

Connect to `ws://localhost:3000` and authenticate immediately after connecting. The backend establishes a `WebSocketServer` sharing the HTTP port.

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `{ token }` | Authenticate the WS connection via JWT |
| `dm:send` | `{ receiverId, content }` | Send a direct message |
| `room:send` | `{ roomId, content }` | Send a message to a room |
| `room:join` | `{ roomId }` | Join a chat room to listen for events |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `authenticated` | `{ userId }` | Confirms authentication |
| `dm:receive` | `{ message }` | Incoming DM (sent to receiver only, no sender echo) |
| `room:message` | `{ roomId, message }` | Incoming room message |
| `error` | `{ msg }` | Error response |

---

## 📝 Important Notes

- All routes under `/api/users`, `/api/pets`, `/api/adoptions`, `/api/chat`, and `/api/notifications` require a valid JWT in the `Authorization: Bearer <token>` header.
- Admin-only routes additionally check that the authenticated user has `role: ADMIN`.
- When an adoption is approved, a `ChatRoom` is automatically created inside a Prisma transaction.
- Cloudinary uploads are handled directly from the client using a signed upload signature obtained from `GET /api/pets/upload-signature`.

---

<div align="center">
  <p>Built with ❤️ by Rn :)</p>
</div>