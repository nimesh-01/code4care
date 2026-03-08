# Notification Service

A microservice responsible for **email notifications** and **in-app notifications** across the SoulConnect platform using RabbitMQ message queues and MongoDB.

## Features

### Email Notifications (via RabbitMQ)
- **User Registration**: Welcome emails for new users
- **Orphanage Admin Registration**: Welcome emails for orphanage administrators
- **Password Reset Flow**: Password reset request and confirmation emails
- **Appointment Notifications**: New request, approved, rejected, cancelled
- **Payment Notifications**: Initiated, completed, failed

### In-App Notifications (REST API + MongoDB)
- **Real-time notification feed** for all users (user, volunteer, orphanAdmin)
- **Unread count badge** with polling
- **Filter by status**: All, Unread, Read
- **Mark as read** (single / all)
- **Delete / Clear read** notifications
- Notifications created automatically alongside email notifications

## REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get user's notifications (paginated, filterable) |
| `GET` | `/api/notifications/unread-count` | Get unread notification count |
| `PUT` | `/api/notifications/read-all` | Mark all as read |
| `PUT` | `/api/notifications/:id/read` | Mark one as read |
| `DELETE` | `/api/notifications/:id` | Delete a notification |
| `DELETE` | `/api/notifications/clear` | Clear all read notifications |
| `POST` | `/api/notifications/send` | Send a notification (admin/internal) |

## Queue Events Handled

| Queue Name | Description |
|------------|-------------|
| `AUTH_NOTIFICATION.USER_CREATED` | New user registration |
| `AUTH_NOTIFICATION.ORPHANAGE_ADMIN_CREATED` | New orphanage admin registration |
| `AUTH_NOTIFICATION.PASSWORD_RESET` | Password reset request |
| `AUTH_NOTIFICATION.PASSWORD_RESET_COMPLETED` | Password reset confirmation |
| `APPOINTMENT_NOTIFICATION.NEW_REQUEST` | New appointment request |
| `APPOINTMENT_NOTIFICATION.APPROVED` | Appointment approved |
| `APPOINTMENT_NOTIFICATION.REJECTED` | Appointment rejected |
| `APPOINTMENT_NOTIFICATION.CANCELLED` | Appointment cancelled |
| `PAYMENT_NOTIFICATION.PAYMENT_INITIATED` | Payment initiated |
| `PAYMENT_NOTIFICATION.PAYMENT_COMPLETED` | Payment completed |
| `PAYMENT_NOTIFICATION.PAYMENT_FAILED` | Payment failed |
| `HELP_REQUEST_NOTIFICATION.CREATED` | Help request published |
| `HELP_REQUEST_NOTIFICATION.ACCEPTED` | Volunteer accepted help request |
| `HELP_REQUEST_NOTIFICATION.COMPLETED` | Help request completed |
| `EVENT_NOTIFICATION.CREATED` | New event created |
| `EVENT_NOTIFICATION.VOLUNTEER_JOINED` | User joined event |
| `EVENT_NOTIFICATION.REMINDER` | Event reminder |

## Setup

1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`:
   - `MONGO_URL`: MongoDB connection string
   - `JWT_SECRET`: JWT secret (must match auth service)
   - `RABBIT_URL`: RabbitMQ connection URL
   - `FRONTEND_URL`: Frontend application URL (for email links)
   - `EMAIL_USER`: Gmail address for sending emails
   - `CLIENT_ID`: Google OAuth2 Client ID
   - `CLIENT_SECRET`: Google OAuth2 Client Secret
   - `REFRESH_TOKEN`: Google OAuth2 Refresh Token

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the service:
   ```bash
   npm run dev  # Development mode
   npm start    # Production mode
   ```

## Integration with Other Services

### Auth Service
The auth service publishes events when:
- A new user registers
- An orphanage admin registers
- Password reset is requested
- Password is successfully reset

### Appointment Service
The appointment service publishes events when:
- A new appointment is requested
- An appointment is approved
- An appointment is rejected
- An appointment is cancelled

## Email Templates

All email templates are styled with inline CSS for better email client compatibility and include:
- Professional styling
- Clear call-to-action buttons
- Responsive design
- Branded messaging

## Dependencies

- `express`: Web framework
- `amqplib`: RabbitMQ client
- `nodemailer`: Email sending
- `dotenv`: Environment variable management
- `cors`: Cross-origin resource sharing
