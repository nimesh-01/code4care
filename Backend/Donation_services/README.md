# 💰 Donation & Payment Service

## Overview
The Donation & Payment Service manages the complete donation lifecycle in SoulConnect, including donation creation, secure payment processing via Razorpay, verification, and maintaining donation history.

## Features
- ✅ Donation record creation with PENDING status
- ✅ Razorpay payment gateway integration
- ✅ Secure payment signature verification (HMAC SHA256)
- ✅ Donation history (user-wise, orphanage-wise, child-wise)
- ✅ Purpose-based categorization
- ✅ Refund handling (SuperAdmin only)
- ✅ Role-based access control

## Tech Stack
- Node.js + Express.js
- MongoDB + Mongoose
- Razorpay Payment Gateway
- JWT Authentication

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```

### 3. Run the Service
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables
| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 5006) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | JWT secret key |
| RAZORPAY_KEY_ID | Razorpay Key ID |
| RAZORPAY_KEY_SECRET | Razorpay Key Secret |

## API Endpoints

### 1. Initialize Donation
```
POST /donation/init
Authorization: Bearer <token>

Body:
{
  "amount": 1500,
  "purpose": "Education",
  "orphanageId": "ORPHANAGE_ID",
  "childId": "CHILD_ID" // optional
}

Response:
{
  "success": true,
  "message": "Donation initiated successfully",
  "data": {
    "donationId": "DONATION_ID",
    "orderId": "order_xxxxx",
    "amount": 150000,
    "currency": "INR",
    "keyId": "rzp_test_xxxxx"
  }
}
```

### 2. Verify Payment
```
POST /donation/verify
Authorization: Bearer <token>

Body:
{
  "donationId": "DONATION_ID",
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature_hash"
}

Response:
{
  "success": true,
  "message": "Payment verified successfully. Thank you for your donation!",
  "data": {
    "donationId": "DONATION_ID",
    "amount": 1500,
    "status": "SUCCESS",
    "purpose": "Education"
  }
}
```

### 3. Get User Donations
```
GET /donation/user/:userId
Authorization: Bearer <token>

Query Params: status, purpose, startDate, endDate, page, limit
```

### 4. Get Orphanage Donations
```
GET /donation/orphanage/:orphanageId
Authorization: Bearer <token>

Query Params: status, purpose, startDate, endDate, page, limit
```

### 5. Get Donation by ID
```
GET /donation/:id
Authorization: Bearer <token>
```

### 6. Refund Donation (SuperAdmin only)
```
POST /donation/:id/refund
Authorization: Bearer <token>

Body:
{
  "reason": "Refund reason" // optional
}
```

### 7. Get All Donations (SuperAdmin only)
```
GET /donation/all
Authorization: Bearer <token>

Query Params: status, purpose, gateway, startDate, endDate, page, limit
```

## Donation Purposes
- Education
- Food
- Healthcare
- Clothing
- Shelter
- Emergency Help

## Donation Status Flow
```
PENDING → SUCCESS (payment verified)
PENDING → FAILED (verification failed)
SUCCESS → REFUNDED (admin initiated refund)
```

## Access Control
| Role | Permissions |
|------|-------------|
| User (Donor) | Donate, view own donation history |
| Orphanage Admin | View donations for their orphanage |
| Super Admin | View all donations, process refunds |
| Volunteer | Limited view access (optional) |

## Frontend Integration

### Razorpay Checkout
```javascript
// After calling POST /donation/init
const options = {
  key: response.data.keyId,
  amount: response.data.amount,
  currency: response.data.currency,
  name: "SoulConnect",
  description: "Donation for children",
  order_id: response.data.orderId,
  handler: function (response) {
    // Call POST /donation/verify with:
    // - donationId
    // - response.razorpay_order_id
    // - response.razorpay_payment_id
    // - response.razorpay_signature
  },
  prefill: {
    name: "Donor Name",
    email: "donor@email.com"
  },
  theme: {
    color: "#3399cc"
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

## Project Structure
```
donation_service/
├── server.js
├── package.json
├── .env
├── .env.example
├── README.md
└── src/
    ├── app.js
    ├── config/
    │   ├── db.js
    │   └── razorpay.config.js
    ├── controllers/
    │   └── donation.controller.js
    ├── middlewares/
    │   ├── auth.middleware.js
    │   ├── roles.middleware.js
    │   └── error.middleware.js
    ├── models/
    │   └── donation.model.js
    ├── routes/
    │   └── donation.routes.js
    ├── services/
    │   └── razorpay.service.js
    └── utils/
        ├── asyncHandler.js
        └── validators.js
```

## Testing with Razorpay Test Mode
Use Razorpay test credentials and test card numbers:
- Success Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

## License
ISC
