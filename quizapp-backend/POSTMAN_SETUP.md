# Testing the Register Endpoint with Postman

## Step 1: Make Sure Your Server is Running

1. Open a terminal/command prompt
2. Navigate to your backend directory:
   ```
   cd C:\Users\yashwanth\Desktop\quiz_cluod\quizapp-backend
   ```
3. Start the server:
   ```
   node server.js
   ```
4. Confirm you see the message "Server running on port 8000" and "MongoDB connected ✅"

## Step 2: Set Up Postman Request

1. Open Postman
2. Create a new request with the following configuration:

### Request Details

- **Method**: POST
- **URL**: `http://localhost:8000/api/auth/register`

### Headers

- Click on the "Headers" tab
- Add a header:
  - Key: `Content-Type`
  - Value: `application/json`

### Body

- Click on the "Body" tab
- Select "raw" and choose "JSON" from the dropdown
- Enter the following JSON:

```json
{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
}
```

## Step 3: Send the Request

1. Click the "Send" button
2. Expected successful response (Status code: 201):

```json
{
    "message": "User registered successfully",
    "userId": "some-user-id-here"
}
```

## Troubleshooting

If you get a 404 Not Found error:

1. **Check URL**: Make sure the URL is exactly `http://localhost:8000/api/auth/register`
2. **Check server logs**: Look at your server terminal for any error messages
3. **Check MongoDB connection**: Ensure MongoDB is connected properly
4. **Server restart**: Try stopping and restarting your server
5. **Route spelling**: Double-check the route spelling in your API call

If you get a different error:

1. **400 Bad Request**: The user might already exist. Try a different email/username.
2. **500 Server Error**: Check server logs for detailed error information.

## Testing the Login Endpoint

After successful registration, you can test the login endpoint:

- **Method**: POST
- **URL**: `http://localhost:8000/api/auth/login`
- **Headers**: Same as above
- **Body**:

```json
{
    "email": "test@example.com",
    "password": "password123"
}
```

Expected successful response will include a JWT token.

