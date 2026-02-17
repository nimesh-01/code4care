# 🆘 Help Request Service (HelpRequest-Service)

Help Request Service for **SoulConnect – Orphanage Management & Support System**

## 📌 Purpose

The Help Request Service enables orphanage administrators to raise specific support requests for children and orphanage activities, such as educational assistance, medical help, exam support, or special needs. It creates a structured platform where volunteers can view, accept, and complete these requests, ensuring timely and organized support.

## 🧠 Responsibilities

- Allow orphanage admins to create help requests with detailed requirements
- Display available help requests to volunteers
- Enable volunteers to accept and complete assigned tasks
- Manage the lifecycle of help requests (Pending → Accepted → Completed)
- Maintain transparency and accountability through status tracking

## 🔐 Access Control

| Role            | Permission                              |
|-----------------|----------------------------------------|
| Orphanage Admin | Create and monitor help requests        |
| Volunteer       | View, accept, and complete help requests|
| Super Admin     | View all help requests (audit purpose)  |
| User            | No access                               |

## 🗂 Help Request Data Model

| Field                | Type       | Description                                    |
|---------------------|------------|------------------------------------------------|
| orphanageId         | ObjectId   | Reference to orphanage                         |
| childId             | ObjectId   | Optional reference to child                    |
| requestType         | String     | Teaching / Medical / Exam / Other              |
| description         | String     | Detailed description of help needed            |
| requiredSkills      | [String]   | Array of required skills                       |
| status              | String     | Pending / Accepted / Completed                 |
| assignedVolunteerId | ObjectId   | Reference to assigned volunteer                |
| createdBy           | ObjectId   | Reference to creator (admin)                   |
| completedAt         | Date       | Timestamp when completed                       |
| createdAt           | Date       | Auto-generated timestamp                       |
| updatedAt           | Date       | Auto-generated timestamp                       |

## 📡 API Endpoints

### 1️⃣ Create Help Request
```
POST /help/add
```
**Access:** Orphanage Admin

**Request Body:**
```json
{
  "requestType": "Teaching",
  "description": "Need help with math tutoring for 3 children",
  "requiredSkills": ["Mathematics", "Teaching"],
  "childId": "optional-child-id"
}
```

**Response:**
```json
{
  "message": "Help request created successfully",
  "helpRequest": { ... }
}
```

### 2️⃣ Get All Help Requests
```
GET /help/all
```
**Access:** Volunteer, Orphanage Admin, Super Admin

**Query Parameters:**
- `status`: Filter by status (Pending/Accepted/Completed)
- `requestType`: Filter by type (Teaching/Medical/Exam/Other)
- `sort`: Sort field (default: createdAt)
- `order`: Sort order (asc/desc, default: desc)

**Behavior:**
- **Volunteer:** Sees all Pending help requests
- **Orphanage Admin:** Sees help requests from their orphanage
- **Super Admin:** Sees all help requests

### 3️⃣ Accept Help Request
```
PUT /help/:id/accept
```
**Access:** Volunteer

**Condition:** Request status must be Pending

**Response:**
```json
{
  "message": "Help request accepted successfully",
  "helpRequest": { ... }
}
```

### 4️⃣ Complete Help Request
```
PUT /help/:id/complete
```
**Access:** Volunteer (assigned volunteer only)

**Response:**
```json
{
  "message": "Help request completed successfully",
  "helpRequest": { ... }
}
```

### 5️⃣ Get Volunteer-Specific Help Requests
```
GET /help/volunteer/:id
```
**Access:** Volunteer

**Query Parameters:**
- `status`: Filter by status (Accepted/Completed)
- `sort`: Sort field (default: createdAt)
- `order`: Sort order (asc/desc, default: desc)

**Returns:** Accepted and Completed requests for the volunteer's dashboard

### 6️⃣ Get Help Request by ID
```
GET /help/:id
```
**Access:** Volunteer, Orphanage Admin, Super Admin

## ⏱ Status Lifecycle

```
Pending → Accepted → Completed
```

## 🔒 Security & Validation

- JWT authentication via cookies
- Role-based access control
- Ownership and assignment validation
- Input validation for task details
- Rate limiting (recommended to implement at API Gateway level)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB

### Installation

1. Navigate to the service directory:
```bash
cd helpRequest_services
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=3004
MONGO_URL=mongodb://localhost:27017/soulconnect_helprequest
JWT_SECRET=your-jwt-secret
AUTH_SERVICE_URL=http://localhost:3000/auth/orphanage
```

4. Start the service:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## 🧪 Testing Scenarios

1. **Admin creates multiple help requests** - Admin should be able to create Teaching, Medical, Exam, and Other type requests
2. **Volunteer accepts request** - Volunteer should be able to accept any Pending request
3. **Unauthorized volunteer tries to complete (blocked)** - Only assigned volunteer can complete a request
4. **Admin views completion status** - Admin can monitor all help requests for their orphanage

## 📁 Project Structure

```
helpRequest_services/
├── package.json
├── server.js
├── README.md
└── src/
    ├── app.js
    ├── db/
    │   └── db.js
    ├── models/
    │   └── helpRequest.model.js
    ├── middlewares/
    │   ├── auth.middleware.js
    │   └── roles.middleware.js
    ├── controllers/
    │   └── helpRequest.controller.js
    └── routes/
        └── helpRequest.routes.js
```

## 📝 License

ISC
