# Maritime Management Backend API

A comprehensive REST API for managing maritime operations, including ships, maintenance tasks, safety drills, and crew compliance tracking.

## Features

- **User Management**: Role-based access control (ADMIN, CREW) with JWT authentication
- **Ship Management**: Register and manage vessels
- **Maintenance Tracking**: Create, update, and track maintenance tasks with status management
- **Safety Drills**: Schedule and manage safety drills with crew attendance tracking
- **Compliance Dashboard**: Real-time compliance metrics and risk assessment for all ships

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (ES Modules)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs for password hashing
- **Environment**: dotenv for configuration

## Project Structure

```
maritime-api/
├── src/
│   ├── index.js                 # Application entry point
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── errorHandler.js      # Global error handling
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── maintenanceController.js  # Maintenance task logic
│   │   ├── drillController.js   # Safety drill logic
│   │   └── complianceController.js   # Compliance dashboard logic
│   └── routes/
│       ├── index.js             # Main router
│       ├── authRoutes.js        # Auth endpoints
│       ├── maintenanceRoutes.js # Maintenance endpoints
│       ├── drillRoutes.js       # Drill endpoints
│       └── complianceRoutes.js  # Compliance endpoints
├── prisma/
│   └── schema.prisma            # Database schema
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## Setup Instructions

### 1. Prerequisites

- Node.js v18 or higher
- PostgreSQL 12 or higher
- npm or yarn

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```
DATABASE_URL="postgresql://username:password@localhost:5432/maritime_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3000
```

### 4. Database Setup

Create PostgreSQL database:

```bash
createdb maritime_db
```

Run Prisma migrations to create tables:

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client:

```bash
npx prisma generate
```

### 5. Run the Application

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm run start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Maintenance Tasks (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/maintenance` | Create maintenance task |
| GET | `/api/maintenance` | List tasks (with filters) |
| GET | `/api/maintenance/:id` | Get task details |
| PUT | `/api/maintenance/:id` | Update task status |
| DELETE | `/api/maintenance/:id` | Delete task |

### Safety Drills (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/drills` | Create safety drill |
| GET | `/api/drills` | List all drills |
| GET | `/api/drills/:id` | Get drill details |
| POST | `/api/drills/:drillId/attendance` | Record crew attendance |
| GET | `/api/drills/:drillId/attendance` | Get attendance records |
| DELETE | `/api/drills/:id` | Delete drill |

### Compliance Dashboard (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/compliance/ships/:shipId` | Get compliance for specific ship |
| GET | `/api/compliance/dashboard` | Get compliance for all ships |

## Testing the API

### Using cURL

#### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@maritime.com",
    "password": "SecurePass123!",
    "role": "ADMIN"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@maritime.com",
    "password": "SecurePass123!"
  }'
```

#### Create Maintenance Task

```bash
curl -X POST http://localhost:3000/api/maintenance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "shipId": 1,
    "title": "Engine Inspection",
    "description": "Perform routine engine maintenance",
    "dueDate": "2026-06-15"
  }'
```

### Using Postman

1. Import the endpoints into Postman
2. Set the `Authorization` header to `Bearer {JWT_TOKEN}` for protected routes
3. Test each endpoint with sample data

## Database Schema

### Users
- `id`: Auto-increment primary key
- `email`: Unique email address
- `password`: Hashed password
- `role`: ADMIN or CREW
- `createdAt`, `updatedAt`: Timestamps

### Ships
- `id`: Auto-increment primary key
- `name`: Ship name
- `createdAt`, `updatedAt`: Timestamps

### MaintenanceTasks
- `id`: Auto-increment primary key
- `shipId`: Reference to Ship
- `title`: Task title
- `description`: Task details
- `status`: PENDING, IN_PROGRESS, COMPLETED
- `dueDate`: Due date
- `completedDate`: Completion date
- `createdBy`: User ID
- `createdAt`, `updatedAt`: Timestamps

### SafetyDrills
- `id`: Auto-increment primary key
- `shipId`: Reference to Ship
- `title`: Drill title
- `description`: Drill details
- `scheduledDate`: When drill is scheduled
- `status`: SCHEDULED, COMPLETED, CANCELLED
- `createdBy`: User ID
- `createdAt`, `updatedAt`: Timestamps

### DrillAttendance
- `id`: Auto-increment primary key
- `drillId`: Reference to SafetyDrill
- `crewId`: Reference to User (crew member)
- `attended`: Boolean attendance status
- `createdAt`, `updatedAt`: Timestamps

## Error Handling

The API uses standard HTTP status codes:

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

All errors return JSON response:

```json
{
  "error": "Error message description",
  "statusCode": 400
}
```

## Authentication Flow

1. Register user with email and password
2. Login to receive JWT token
3. Include JWT in `Authorization: Bearer {token}` header for protected routes
4. Token validates user identity and role

## Compliance Scoring

Compliance score is calculated as:

```
Score = (Task Completion Rate × 50) + (Attendance Rate × 50)
```

- **Good**: Score ≥ 80
- **Fair**: Score 60-79
- **At Risk**: Score < 60

