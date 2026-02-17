# Appointment Service

A microservice for managing appointment scheduling between users/volunteers and orphanages in the SoulConnect platform.

## Features

- **Request Appointment**: Users and volunteers can request appointments with orphanages
- **Approve/Reject Appointments**: Orphanage admins can approve or reject appointment requests
- **Cancel Appointments**: Users can cancel their own appointments
- **View Appointments**: Filter and sort appointments by status

## Email Notifications

This service integrates with the notification service via RabbitMQ to send emails when:
- A new appointment is requested (email to orphanage)
- An appointment is approved (email to requester)
- An appointment is rejected (email to requester)
- An appointment is cancelled (email to orphanage)

## Environment Variables

- `MONGO_URL` - MongoDB connection string (defaults to local)
- `PORT` - Server port (defaults to 4000)
- `JWT_SECRET` - Secret for verifying JWTs
- `RABBIT_URL` - RabbitMQ connection URL
- `AUTH_SERVICE_URL` - Auth service URL for fetching user/orphanage details

## Setup

```bash
npm install
npm run dev   # Development mode
npm start     # Production mode
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/appointment/request` | Request an appointment | User, Volunteer |
| GET | `/appointment/all` | List appointments (filtered by role) | Required |
| PUT | `/appointment/:id/approve` | Approve appointment | OrphanageAdmin |
| PUT | `/appointment/:id/reject` | Reject appointment | OrphanageAdmin |
| DELETE | `/appointment/:id/cancel` | Cancel appointment | Requester only |

## Notes

- JWT payload must contain `id`, `role`, and `orphanageId` for admin tokens
- All appointment status changes trigger email notifications via the notification service
