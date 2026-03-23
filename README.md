# Agency Dashboard - Real-Time Project Management System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7-0c344b)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.5-010101)](https://socket.io/)

A comprehensive project management dashboard with role-based access control, real-time activity feeds, and WebSocket-based live updates.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Decisions](#architecture-decisions)
- [Database Schema](#database-schema)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)

## 🚀 Features

### Role-Based Access Control
- **Admin**: Full system access, manage all users and projects
- **Project Manager**: Create/manage own projects, assign tasks
- **Developer**: View and update assigned tasks only

### Real-Time Capabilities
- Live activity feed with WebSocket updates
- Role-filtered activity streams (global for admin, project-specific for PMs, task-specific for developers)
- Offline catchup: users see last 20 missed events when reconnecting
- Live online user count with presence detection

### Project & Task Management
- Complete CRUD operations with validation
- Task status workflow: Todo → In Progress → In Review → Done
- Priority levels: Low, Medium, High, Critical
- Automatic overdue task detection (runs hourly via Bull queue)
- Activity logging for all status changes

### Notifications
- In-app notifications for task assignments
- Real-time notification badge updates via WebSocket
- Mark as read individually or all at once
- PM notifications when tasks reach "In Review"

### Dashboards
- **Admin**: Global metrics, task distribution charts, online users
- **PM**: Project summaries, priority breakdown, upcoming due dates
- **Developer**: Assigned tasks sorted by priority and due date

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API server |
| TypeScript | Type safety |
| PostgreSQL + Prisma | Database & ORM |
| Socket.io | WebSocket server |
| JWT | Authentication |
| Bull + Redis | Background jobs |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Socket.io-client | WebSocket client |
| React Query | Data fetching |
| Tailwind CSS | Styling |
| React Router | Navigation |

## 🏗️ Architecture Decisions

### WebSocket Choice: Socket.io
**Justification**: Chosen over native WebSocket for:
- Automatic reconnection handling
- Room-based broadcasting for role-filtered feeds
- Built-in fallback to long-polling
- Presence detection capabilities
- Simpler API for event handling

### Background Jobs: Bull Queue
**Justification**: Selected for:
- Persistent job storage in Redis
- Retry capabilities on failure
- Job prioritization
- Worker process isolation
- Better monitoring and debugging

### Token Storage: HttpOnly Cookies
**Security Decision**: Refresh tokens stored in HttpOnly cookies to prevent XSS attacks. Access tokens in memory for performance.

### Database Indexing Strategy
Critical indexes added on:
- User.email, User.role - for authentication queries
- Task.status, Task.dueDate, Task.isOverdue - for filtering and overdue checks
- Project.managerId - for PM project filtering
- ActivityLog.createdAt - for timeline queries
- Notification.userId, Notification.isRead - for notification fetching

## 📊 Database Schema

\\\
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     User        │     │    Project      │     │     Task        │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │────<│ managerId (FK)  │     │ id (PK)         │
│ email           │     │ clientId (FK)   │────<│ projectId (FK)  │
│ password        │     │ name            │     │ assignedToId(FK)│
│ name            │     │ description     │     │ title           │
│ role            │     │ status          │     │ status          │
└─────────────────┘     └─────────────────┘     │ priority        │
        │                                        │ dueDate         │
        │                                        └─────────────────┘
        │                                        ┌─────────────────┐
        └───────────────────────────────────────>│  ActivityLog    │
                                                 ├─────────────────┤
┌─────────────────┐     ┌─────────────────┐     │ id (PK)         │
│   Client        │     │  Notification   │     │ userId (FK)     │
├─────────────────┤     ├─────────────────┤     │ projectId (FK)  │
│ id (PK)         │     │ id (PK)         │     │ taskId (FK)     │
│ name            │     │ userId (FK)     │     │ action          │
│ email           │     │ type            │     │ createdAt       │
│ company         │     │ message         │     └─────────────────┘
└─────────────────┘     │ isRead          │
                        └─────────────────┘
\\\

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v15+) or SQLite for development
- npm or yarn

### Installation

\\\ash
# Clone the repository
git clone https://github.com/architnidhi/agency-dashboard.git
cd agency-dashboard

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Start backend server
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
cp .env.example .env
npm run dev
\\\

### Docker Setup (Recommended)

\\\ash
docker-compose up --build
\\\

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agency.com | password123 |
| Project Manager | pm1@agency.com | password123 |
| Developer | dev1@agency.com | password123 |

## 📝 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login user |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Logout user |
| GET | /api/auth/me | Get current user |

### Project Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/projects | List projects | All authenticated |
| POST | /api/projects | Create project | Admin, PM |
| PUT | /api/projects/:id | Update project | Admin, PM (own) |
| DELETE | /api/projects/:id | Delete project | Admin only |

### Task Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/tasks | List tasks | All authenticated (filtered) |
| POST | /api/tasks | Create task | Admin, PM |
| PATCH | /api/tasks/:id/status | Update task status | All authenticated |
| DELETE | /api/tasks/:id | Delete task | Admin only |

## 🧪 Testing

\\\ash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
\\\

## 🐳 Deployment

### Production Build

\\\ash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
\\\

### Environment Variables for Production
- Set \NODE_ENV=production\
- Use strong JWT secrets
- Enable HTTPS
- Configure proper CORS origins

## ⚠️ Known Limitations

1. **WebSocket Scaling**: Current implementation doesn't support horizontal scaling across multiple server instances. For production, implement Redis adapter for Socket.io.

2. **File Attachments**: Task attachments not implemented. Currently text-only tasks.

3. **Mobile Responsiveness**: Dashboard is desktop-optimized. Mobile views have limited testing.

4. **Email Notifications**: Not implemented. Currently in-app notifications only.

5. **Search Functionality**: Basic search only. Full-text search not implemented.

6. **Real-time Updates**: Users must be online to receive updates. No email/SMS fallback.

7. **Concurrent Editing**: No locking mechanism for simultaneous task edits. Last write wins.

8. **Rate Limiting**: Basic rate limiting on auth routes only. Needs expansion to all endpoints.

## 🔒 Security Considerations

- All endpoints protected with role-based middleware
- JWT tokens with short expiry (15min)
- Refresh tokens in HttpOnly cookies
- SQL injection prevention via Prisma
- Helmet.js for security headers
- CORS properly configured
- Input validation on all endpoints

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (\git checkout -b feature/amazing-feature\)
3. Commit changes (\git commit -m 'Add amazing feature'\)
4. Push to branch (\git push origin feature/amazing-feature\)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 👤 Author

**Archit Nidhi**
- GitHub: [@architnidhi](https://github.com/architnidhi)

## 🙏 Acknowledgments

- Socket.io team for real-time capabilities
- Prisma team for excellent ORM
- All contributors and testers

---
⭐ Star this repository if you find it helpful!
