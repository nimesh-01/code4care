# 💬 Chat Messaging Service (Chat-Service)

## 📌 Purpose

The Chat Messaging Service provides a secure and real-time communication channel between Orphanage Admins, Users (Donors), and Volunteers. It eliminates delays caused by traditional communication methods and enables instant interaction for queries, appointment discussions, help requests, and general coordination.

## 🚀 Features

- ✅ Real-time messaging using Socket.io
- ✅ Persistent message storage in MongoDB
- ✅ Message status tracking (Sent → Delivered → Read)
- ✅ Conversation history management
- ✅ Typing indicators
- ✅ Online/Offline status
- ✅ Read receipts
- ✅ Offline message delivery
- ✅ Rate limiting for spam prevention
- ✅ Role-based access control

## 🔐 Access Control

| Role            | Permission                          |
|-----------------|-------------------------------------|
| Orphanage Admin | Chat with users and volunteers      |
| User (Donor)    | Chat with orphanage admin           |
| Volunteer       | Chat with orphanage admin           |
| Super Admin     | View chats (audit only, optional)   |

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT

## 📁 Project Structure

```
Chat_services/
├── server.js                 # Entry point with Socket.io setup
├── package.json              # Dependencies
├── .env.example              # Environment variables template
├── README.md                 # Documentation
└── src/
    ├── app.js               # Express app configuration
    ├── db/
    │   └── db.js            # MongoDB connection
    ├── models/
    │   ├── conversation.model.js  # Conversation schema
    │   └── message.model.js       # Message schema
    ├── controllers/
    │   └── chat.controller.js     # Chat logic
    ├── routes/
    │   └── chat.routes.js         # API routes
    ├── middlewares/
    │   └── auth.middleware.js     # JWT & role authentication
    └── socket/
        └── socket.js              # Socket.io handlers
```

## 📡 API Endpoints

### 1️⃣ Send Message
```
POST /chat/message
```
**Access**: Admin, User, Volunteer

**Request Body**:
```json
{
  "receiverId": "user_id_here",
  "receiverRole": "orphanAdmin",
  "content": "Hello, I have a question",
  "messageType": "text"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "...",
    "conversationId": "...",
    "status": "sent",
    "sentAt": "2026-01-06T10:00:00.000Z"
  }
}
```

### 2️⃣ Get Chat History
```
GET /chat/history/:conversationId?page=1&limit=50
```
**Access**: Only participants of the conversation

**Response**:
```json
{
  "success": true,
  "data": {
    "messages": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalMessages": 250,
      "hasMore": true
    }
  }
}
```

### 3️⃣ Get Conversations
```
GET /chat/conversations?page=1&limit=20
```
**Access**: Admin, User, Volunteer

### 4️⃣ Get/Create Conversation
```
POST /chat/conversation
```
**Request Body**:
```json
{
  "receiverId": "user_id_here",
  "receiverRole": "orphanAdmin"
}
```

### 5️⃣ Mark Messages as Read
```
PATCH /chat/read/:conversationId
```

### 6️⃣ Delete Message
```
DELETE /chat/message/:messageId
```

### 7️⃣ Get Unread Count
```
GET /chat/unread
```

## 🔌 Socket.io Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `sendMessage` | `{ receiverId, receiverRole, content, messageType }` | Send a message |
| `typing` | `{ conversationId, receiverId }` | User is typing |
| `stopTyping` | `{ conversationId, receiverId }` | User stopped typing |
| `markAsRead` | `{ conversationId }` | Mark messages as read |
| `joinConversation` | `{ conversationId }` | Join conversation room |
| `leaveConversation` | `{ conversationId }` | Leave conversation room |
| `getOnlineStatus` | `{ userIds: [] }` | Check online status |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `receiveMessage` | `{ message }` | New message received |
| `messageSent` | `{ message }` | Confirmation of sent message |
| `messageDelivered` | `{ messageId, deliveredAt }` | Message was delivered |
| `messagesRead` | `{ conversationId, readBy, readAt }` | Messages were read |
| `userTyping` | `{ conversationId, userId, isTyping }` | Typing indicator |
| `userOnline` | `{ userId, role }` | User came online |
| `userOffline` | `{ userId, role, lastSeen }` | User went offline |

## ⏱ Message Status Flow

```
Sent → Delivered → Read
```

- **Sent**: Message saved in database
- **Delivered**: Receiver's socket received the message
- **Read**: Receiver opened the conversation

## 🔒 Security Features

- JWT-based authentication for REST API and WebSocket
- Role-based access control
- Conversation ownership validation
- Message content validation (max 5000 chars)
- Rate limiting (60 requests/minute)
- CORS protection

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd Chat_services
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start the Server

**Development**:
```bash
npm run dev
```

**Production**:
```bash
npm start
```

## 🔌 Client Integration Example

### JavaScript/React
```javascript
import { io } from 'socket.io-client';

// Connect with authentication
const socket = io('http://localhost:5004', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Listen for connection
socket.on('connect', () => {
  console.log('Connected to chat server');
});

// Send message
socket.emit('sendMessage', {
  receiverId: 'user123',
  receiverRole: 'orphanAdmin',
  content: 'Hello!'
}, (response) => {
  if (response.success) {
    console.log('Message sent:', response.message);
  }
});

// Receive message
socket.on('receiveMessage', ({ message }) => {
  console.log('New message:', message);
});

// Typing indicator
socket.emit('typing', {
  conversationId: 'conv123',
  receiverId: 'user123'
});

// Mark as read
socket.emit('markAsRead', {
  conversationId: 'conv123'
});
```

## 🧪 Testing Scenarios

1. ✅ Admin chatting with multiple users
2. ✅ Volunteer receiving real-time messages
3. ✅ Message delivery during offline mode
4. ✅ Unauthorized access blocked
5. ✅ Read receipts working correctly
6. ✅ Typing indicators functional
7. ✅ Rate limiting prevents spam

## 📝 Data Models

### Conversation
- `participants[]` - Array of participant objects
- `lastMessage` - Reference to last message
- `unreadCount` - Map of unread counts per user
- `status` - active/archived/blocked

### Message
- `conversationId` - Reference to conversation
- `sender` - Sender info (id, model, role)
- `receiver` - Receiver info (id, model, role)
- `content` - Message text
- `messageType` - text/image/file/system
- `status` - sent/delivered/read
- `timestamps` - sentAt, deliveredAt, readAt

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5004 |
| `MONGO_URL` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `NODE_ENV` | Environment | development |
