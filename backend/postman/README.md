# RapidStroke API - Postman Collection

This directory contains Postman collection and environment files to test the RapidStroke API endpoints.

## Files

- **`RapidStroke-API.postman_collection.json`** - Complete collection of API endpoints
- **`RapidStroke-API.postman_environment.json`** - Environment variables and settings

## How to Use

### 1. Import into Postman

1. Open Postman
2. Click "Import" button
3. Upload both files:
   - `RapidStroke-API.postman_collection.json`
   - `RapidStroke-API.postman_environment.json`

### 2. Set Environment

1. In Postman, select "RapidStroke API Environment" from the environment dropdown
2. Verify the `base_url` is set to `http://localhost:5000/api`

### 3. Test Workflow

#### Authentication Flow

1. **Health Check** - Verify API is running
2. **Register User** - Creates new user and auto-saves JWT token
3. **Login User** - Alternative login (if registration fails)
4. **Get User Profile** - Test protected route with JWT token

#### Patient Management Flow

1. **Create Patient** - Creates patient and saves patient ID
2. **Get All Patients** - List all patients (requires clinician/radiologist role)
3. **Get Patient by ID** - Retrieve specific patient
4. **Update Patient** - Modify patient information
5. **Get My Patients** - Get user's own patient records
6. **Delete Patient** - Remove patient record

#### Error Testing

1. **Test Invalid Route** - Verify 404 handling
2. **Test Unauthorized Access** - Verify authentication requirements

## Features

### Automatic Token Management

- JWT tokens are automatically saved to environment variables after login/registration
- All protected endpoints automatically use the saved token

### Test Scripts

Each request includes test scripts that:

- Validate response status codes
- Check response structure
- Save relevant data (tokens, IDs) to environment variables
- Provide clear success/failure feedback

### Environment Variables

- `base_url` - API base URL (<http://localhost:5000/api>)
- `auth_token` - JWT authentication token (auto-populated)
- `user_id` - Current user ID (auto-populated)
- `patient_id` - Last created patient ID (auto-populated)

## Sample Data

### User Registration

```json
{
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@hospital.com",
  "password": "securepassword123",
  "dob": "1985-03-15",
  "role": "clinician"
}
```

### Patient Creation

```json
{
  "name": "John Smith",
  "age": 45,
  "gender": "male",
  "symptoms": ["headache", "dizziness", "nausea"],
  "medicalHistory": "Hypertension, diabetes",
  "currentMedications": "Lisinopril, Metformin",
  "allergies": "Penicillin",
  "emergencyContact": {
    "name": "Jane Smith",
    "relationship": "spouse",
    "phone": "+1234567890"
  }
}
```

## Role-based Access

### Patient Role

- Can create patient records
- Can view own patient records
- Cannot access all patients list
- Cannot update/delete other patients

### Clinician/Radiologist Role

- Full access to all patient operations
- Can view, create, update, delete all patients
- Can search and paginate through patients

## Testing Tips

1. **Start with Health Check** to ensure API is running
2. **Register first** - this automatically saves your token
3. **Test role permissions** by changing user roles in registration
4. **Use search parameters** in "Get All Patients" to test filtering
5. **Check response times** and error handling
6. **Test edge cases** with invalid data

## Troubleshooting

### Common Issues

- **401 Unauthorized**: Make sure you're logged in and token is saved
- **403 Forbidden**: Check if your user role has the required permissions
- **404 Not Found**: Verify the API server is running on port 5000
- **500 Internal Server Error**: Check server logs for database connection issues

### Environment Variables Not Saving

- Ensure you've selected the "RapidStroke API Environment"
- Check if the test scripts are running properly
- Manually set the `auth_token` if auto-save fails
