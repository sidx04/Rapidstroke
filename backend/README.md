# RapidStroke Backend API

A comprehensive backend API for the RapidStroke medical application, providing authentication and patient management functionality.

## Features

- **Authentication System**
  - User registration with role-based access (patient, clinician, radiologist)
  - Secure login with JWT tokens
  - Password hashing with bcrypt
  - Profile management

- **Patient Management**
  - Create, read, update, delete patient records
  - Role-based access control
  - Search and pagination
  - Emergency contact management

- **Security**
  - JWT-based authentication
  - Role-based authorization
  - Input validation and sanitization
  - MongoDB injection protection

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Environment**: dotenv for configuration

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or connection string to remote instance)
- npm or yarn package manager

### Installation

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the `.env` file and update the values:

   ```bash
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/rapidstroke
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

4. **Start MongoDB**

   Make sure MongoDB is running on your system or update the `MONGODB_URI` to point to your MongoDB instance.

5. **Start the development server**

   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "dob": "1990-01-01",
  "role": "patient"
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Get Profile (Protected)

```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

### Patient Routes (`/api/patients`)

All patient routes require authentication. Include the JWT token in the Authorization header.

#### Create Patient

```http
POST /api/patients
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "age": 45,
  "gender": "female",
  "symptoms": ["headache", "dizziness"],
  "medicalHistory": "Hypertension",
  "currentMedications": "Lisinopril",
  "allergies": "None known",
  "emergencyContact": {
    "name": "John Smith",
    "relationship": "spouse",
    "phone": "+1234567890"
  }
}
```

#### Get All Patients (Clinician/Radiologist only)

```http
GET /api/patients?page=1&limit=10&search=jane
Authorization: Bearer <jwt_token>
```

#### Get Patient by ID

```http
GET /api/patients/:id
Authorization: Bearer <jwt_token>
```

#### Update Patient (Clinician/Radiologist only)

```http
PUT /api/patients/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "symptoms": ["headache", "dizziness", "nausea"],
  "medicalHistory": "Hypertension, migraine"
}
```

#### Delete Patient (Clinician/Radiologist only)

```http
DELETE /api/patients/:id
Authorization: Bearer <jwt_token>
```

#### Get My Patients

```http
GET /api/patients/my-patients
Authorization: Bearer <jwt_token>
```

## User Roles

- **Patient**: Can create patient records and view their own records
- **Clinician**: Can view, create, update, and delete all patient records
- **Radiologist**: Can view, create, update, and delete all patient records

## Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "message": "Description of the result",
  "data": {
    // Response data (when applicable)
  }
}
```

## Error Handling

The API includes comprehensive error handling for:

- Validation errors
- Authentication failures
- Authorization violations
- Database errors
- Server errors

## Frontend Integration

The frontend expects the API to be running on `http://10.42.67.2:5000` (as configured in the React Native app). To change this:

1. Update the `API_BASE_URL` in your frontend auth screens
2. Or update your server to run on the expected IP/port

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server (requires build first)
- `npm run clean` - Remove build directory

### Project Structure

```
backend/
├── config/
│   └── database.ts        # MongoDB connection
├── controllers/
│   ├── authController.ts  # Authentication logic
│   └── patientController.ts # Patient management logic
├── middleware/
│   └── auth.ts           # JWT middleware & authorization
├── models/
│   ├── User.ts           # User schema
│   └── Patient.ts        # Patient schema
├── routes/
│   ├── auth.ts           # Authentication routes
│   └── patients.ts       # Patient management routes
├── utils/
│   └── jwt.ts            # JWT utility functions
├── types.ts              # TypeScript type definitions
├── index.ts              # Main server file
└── package.json
```

## Security Notes

1. **Change JWT Secret**: Update `JWT_SECRET` in production to a secure, random string
2. **Database Security**: Secure your MongoDB instance with authentication
3. **CORS**: Configure CORS origins appropriately for production
4. **Rate Limiting**: Consider adding rate limiting for API endpoints
5. **HTTPS**: Use HTTPS in production
6. **Input Validation**: All inputs are validated, but additional sanitization may be needed

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the `MONGODB_URI` in `.env`
   - Verify network connectivity

2. **JWT Token Issues**
   - Ensure `JWT_SECRET` is set in `.env`
   - Check token expiration (`JWT_EXPIRE`)
   - Verify token format in requests

3. **Port Already in Use**
   - Change `PORT` in `.env`
   - Kill existing processes on the port

4. **Validation Errors**
   - Check required fields in request body
   - Verify data types match schema requirements

## License

This project is part of the RapidStroke medical application suite.
