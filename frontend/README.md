<div align="center">

# 🐾 PawMitra Client Platform

**A modern, real-time community application dedicated to reuniting lost pets with their owners and facilitating pet adoptions.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-orange?style=for-the-badge&logo=react&logoColor=white)](https://github.com/pmndrs/zustand)

</div>

<br/>

## 📋 Table of Contents
- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Pages & Routes](#-pages--routes)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Advanced Details](#-advanced-details)

---

## 📖 About the Project

The **PawMitra Frontend** is a fully responsive Single Page Application (SPA) that serves as the user-facing interface for the PawMitra ecosystem. It allows users to report lost or found pets, apply for pet adoptions, and communicate securely with others via real-time WebSockets.

Designed with a mobile-first approach, it features robust state management via Zustand, optimistic UI updates, and a beautifully crafted component system using shadcn/ui.

---

## ✨ Key Features

- **🔐 Secure Authentication:** Seamless user registration with OTP email verification, secure login, and protected routes using `ProtectedRoute`.
- **📡 Real-Time WebSockets Engine:** Instant direct messaging (`/chat`), dynamic chat rooms, and live toast notifications. Smart auto-reconnection with strict-mode safety.
- **🗺️ Interactive Pet Reporting:** Multi-step forms for lost/found reporting.
- **☁️ Cloudinary Integrations:** Direct image upload from the browser; using server-signed signatures so no image data passes through the backend.
- **🐾 Adoption Workflow:** A complete interface for users to submit adoption requests and for admins to manage them.
- **📊 Admin Dashboard:** Specialized views for administrators to monitor system metrics, validate pet reports, manage users, and manage chat rooms.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [React 18](https://react.dev/) | Core UI rendering library. |
| **Build Tool** | [Vite](https://vitejs.dev/) | Extremely fast development server and bundler. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript for scalable development. |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS framework. |
| **UI Components** | [Shadcn UI](https://ui.shadcn.com/) | Tailwind-based customizable UI (Nova preset). |
| **State Management**| [Zustand](https://github.com/pmndrs/zustand) | Minimalist global store (used for Auth state). |
| **Routing** | [React Router v6](https://reactrouter.com/) | Declarative client-side routing. |
| **HTTP client** | Fetch API (`lib/api.ts`) | Auth-wrapped native fetch wrapper. |
| **Real-time** | Native WebSocket | Real-time chat and notifications. |
| **Notifications** | Sonner | Live toast notifications. |

---

## 🏗️ Project Architecture

```text
src/
├── index.css                    # Tailwind base styles
├── App.tsx                      # Route definition hub
├── main.tsx                     # Application mount point
├── types/
│   └── index.ts                 # Shared TypeScript types
├── lib/
│   └── api.ts                   # apiFetch — authenticated fetch wrapper
├── store/
│   └── auth.store.ts            # Zustand auth store (user, token)
├── components/
│   ├── layout/
│   │   └── Layout.tsx           # App shell — navbar, notification polling
│   └── shared/
│       ├── ProtectedRoute.tsx   # Auth guard wrapper
│       └── PetCard.tsx          # Reusable pet listing card
└── pages/                       # Mapped to React Router
    ├── Home.tsx                 # Landing — latest approved pets
    ├── Login.tsx / Register.tsx # Auth views (with OTP flow)
    ├── Search.tsx               # Pet search with filters
    ├── PetDetail.tsx            # Single pet view + adoption request
    ├── EditPet.tsx              # Edit owned pet (Cloudinary upload)
    ├── ReportPet.tsx            # Report lost/found pet
    ├── Profile.tsx              # User profile + owned pets
    ├── Chat.tsx / ChatRooms.tsx # Direct Messaging & Chat rooms
    ├── AdminDashboard.tsx       # Admin panel
    └── Notifications.tsx        # Notification center
```

---

## 🗺️ Pages & Routes

| Route | Page | Auth Required |
|-------|------|:---:|
| `/` | Home | ✗ |
| `/login` | Login | ✗ |
| `/register` | Register | ✗ |
| `/search` | Search | ✗ |
| `/pets/:id` | Pet Detail | ✗ |
| `/pets/:id/edit` | Edit Pet | ✓ |
| `/report` | Report Pet | ✓ |
| `/profile` | Own Profile | ✓ |
| `/users/:id` | User Profile | ✓ |
| `/notifications` | Notifications | ✓ |
| `/chat` | Chat | ✓ |
| `/chat/:userId` | Chat (open DM) | ✓ |
| `/rooms` | Chat Rooms | ✓ |
| `/admin` | Admin Dashboard | ✓ (admin) |

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- The backend API running at `http://localhost:3000`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aryannnn-n/PawMitra.git
   cd pawmitra/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_WS_URL=ws://localhost:3000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

### Production Build

   ```bash
   npm run build
   npm run preview
   ```
   

---

## 🧠 Advanced Details

### API Helper (`lib/api.ts`)
All HTTP requests route through the `apiFetch(path, options?)` wrapper:
- Automatically prepends `VITE_API_URL`
- Injects `Authorization: Bearer <token>` header loaded from the Zustand store
- Throws meaningful errors on non-2xx responses

### State Management
Zustand auth store (`store/auth.store.ts`) holds authentication state persisted via `localStorage`:
- `user`: Logged-in user object
- `token`: JWT access token
- `setAuth()` & `clearAuth()` methods

### WebSocket & Chat Mechanism
- Connects to `VITE_WS_URL` on mount; authenticates with JWT immediately.
- Zero duplicate messages: The backend sends payloads to the receiver only (no sender echo); frontend skips `dm:receive` where sender ID matches the current user.
- **Strict Mode safe:** Implementations use a `destroyed` flag to prevent reconnect loops during React development hot reloads.
- Pre-loads initial sidebar contact lists locally based on user roles (`USER` vs `ADMIN`).

### Important Notes
- The app is built as a single-page application (SPA) — configure your host to serve `index.html` for all routes when deploying.


---

<div align="center">
  <p>Built with ❤️ by Rn :)</p>
</div>