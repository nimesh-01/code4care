# Notification Service

A microservice responsible for sending email notifications across the SoulConnect platform using RabbitMQ message queues.

## Features

- **User Registration Notifications**: Welcome emails for new users
- **Orphanage Admin Registration**: Welcome emails for orphanage administrators
- **Password Reset Flow**: Password reset request and confirmation emails
- **Appointment Notifications**: 
  - New appointment request (to orphanage)
  - Appointment approved (to requester)
  - Appointment rejected (to requester)
  - Appointment cancelled (to orphanage)

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

## Setup

1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`:
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
