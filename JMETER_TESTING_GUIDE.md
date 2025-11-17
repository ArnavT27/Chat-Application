# JMeter Testing Guide for Chat App Backend

This guide will help you test your Chat App backend API using Apache JMeter.

## Prerequisites

1. **Install Apache JMeter**

   - Download from: https://jmeter.apache.org/download_jmeter.cgi
   - Extract and run `jmeter.bat` (Windows) or `jmeter.sh` (Mac/Linux)
   - Or install via package manager:
     - macOS: `brew install jmeter`
     - Linux: `sudo apt-get install jmeter`

2. **Start Your Backend Server**

   ```bash
   cd server
   npm start
   ```

   The server should be running on `http://localhost:8000`

3. **Install JSON Path Plugin (Optional but Recommended)**
   - JMeter 5.0+ includes JSON Path support by default
   - If needed, download from: https://jmeter-plugins.org/

## Test Plan Overview

The test plan (`jmeter-test-plan.jmx`) includes:

### 1. Authentication Tests

- **Signup**: Create a new user account
- **Login**: Authenticate and receive JWT token (stored in cookies)
- **Check Auth**: Verify authentication status
- **Verify Email**: Verify email with code (mock test)
- **Forgot Password**: Request password reset
- **Update Profile**: Update user profile information
- **Logout**: End session

### 2. Message API Tests

- **Get Users for Sidebar**: Retrieve list of users
- **Get Messages**: Retrieve messages between users
- **Send Message**: Send a new message
- **Mark Message as Seen**: Mark message as read

## How to Use

### Step 1: Open the Test Plan

1. Launch JMeter
2. Go to `File` → `Open`
3. Select `jmeter-test-plan.jmx` from the project root

### Step 2: Configure Test Variables

Before running tests, update the test variables:

1. Click on **Test Plan** in the left panel
2. In the **User Defined Variables** section, update:
   - `SERVER_HOST`: Your server host (default: `localhost`)
   - `SERVER_PORT`: Your server port (default: `8000`)
   - `TEST_EMAIL`: Email for testing (default: `test@example.com`)
   - `TEST_PASSWORD`: Password for testing (default: `Test123456!`)

**Important**: Make sure the `TEST_EMAIL` doesn't already exist in your database, or the signup test will fail.

### Step 3: Run the Tests

#### Option A: Run All Tests

1. Click the green **Start** button (▶) in the toolbar
2. Or press `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)

#### Option B: Run Specific Test Groups

1. Right-click on a Thread Group (e.g., "Authentication Tests")
2. Select **Enable** or **Disable** to control which tests run
3. Click **Start**

### Step 4: View Results

1. **View Results Tree**:

   - Shows detailed request/response for each test
   - Green = Success, Red = Failure
   - Click on any request to see full details

2. **Summary Report**:
   - Shows statistics: Average time, Min/Max, Error rate, etc.
   - Useful for performance analysis

## Understanding Test Results

### Success Indicators

- ✅ **Green** status in View Results Tree
- Response code: `200` or `201`
- Response body contains `"status": "success"`

### Common Issues

#### 1. Signup Fails (User Already Exists)

- **Error**: `"User already exists"`
- **Solution**: Change `TEST_EMAIL` in User Defined Variables to a new email

#### 2. Authentication Fails

- **Error**: `"Unauthorised-No token provided"` or `401`
- **Solution**:
  - Make sure Login test runs before protected endpoints
  - Check that Cookie Manager is enabled
  - Verify server is running

#### 3. Connection Refused

- **Error**: `Connection refused` or `Connection timeout`
- **Solution**:
  - Verify server is running on the correct port
  - Check `SERVER_HOST` and `SERVER_PORT` variables
  - Ensure firewall isn't blocking connections

#### 4. Verify Email Fails

- **Error**: `"Invalid or expired verification code"`
- **Note**: This is expected if using a mock code. In real testing, use the actual code sent to your email.

## Test Scenarios Explained

### Authentication Flow

1. **Signup** → Creates user, sets authentication cookie
2. **Login** → Authenticates, extracts user ID
3. **Check Auth** → Verifies token is valid
4. **Update Profile** → Tests authenticated endpoint
5. **Logout** → Clears authentication cookie

### Message Flow

1. **Login** → Authenticate first
2. **Get Users** → Retrieve list of users, extract first user ID
3. **Get Messages** → Retrieve conversation with selected user
4. **Send Message** → Send a test message, extract message ID
5. **Mark as Seen** → Mark the sent message as read

## Customizing Tests

### Adding New Test Cases

1. Right-click on a Thread Group
2. Select `Add` → `Sampler` → `HTTP Request`
3. Configure:
   - **Name**: Descriptive test name
   - **Server Name**: `${SERVER_HOST}`
   - **Port Number**: `${SERVER_PORT}`
   - **Path**: API endpoint (e.g., `/api/auth/login`)
   - **Method**: GET, POST, PUT, DELETE, etc.
   - **Body Data**: JSON payload (if needed)

### Adding Assertions

1. Right-click on an HTTP Request
2. Select `Add` → `Assertions` → `Response Assertion`
3. Configure:
   - **Field to Test**: Response Code
   - **Pattern Matching Rules**: Equals
   - **Patterns to Test**: `200`

### Modifying Request Data

1. Click on an HTTP Request sampler
2. In the **Body Data** tab, modify the JSON:
   ```json
   {
     "email": "${TEST_EMAIL}",
     "password": "${TEST_PASSWORD}"
   }
   ```

## Performance Testing

To test performance under load:

1. Right-click on a Thread Group
2. Modify:

   - **Number of Threads**: Number of concurrent users (e.g., `10`)
   - **Ramp-up Period**: Time to start all threads (e.g., `10` seconds)
   - **Loop Count**: Number of iterations (e.g., `5`)

3. Add listeners for performance metrics:
   - **Aggregate Report**: Summary statistics
   - **Graph Results**: Visual performance graph
   - **Response Times Over Time**: Response time trends

## Tips for Effective Testing

1. **Test in Order**: Authentication tests should run before message tests
2. **Use Variables**: Leverage `${VARIABLE_NAME}` for reusable values
3. **Check Cookies**: Cookie Manager automatically handles authentication cookies
4. **Review Logs**: Check JMeter log file for detailed error messages
5. **Save Results**: Use "Save Responses to a file" for debugging
6. **Clean Database**: Reset test data between test runs if needed

## API Endpoints Tested

### Authentication Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/check-auth` - Verify authentication
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/forgot-password/:token` - Reset password
- `PUT /api/auth/update-profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Message Endpoints

- `GET /api/messages/users` - Get all users for sidebar
- `GET /api/messages/:id` - Get messages with a user
- `POST /api/messages/send/:id` - Send a message
- `PATCH /api/messages/mark/:id` - Mark message as seen

## Troubleshooting

### JMeter Won't Start

- Check Java is installed: `java -version`
- JMeter requires Java 8 or higher
- Increase heap size if needed: `export HEAP="-Xms1g -Xmx1g -XX:MaxMetaspaceSize=256m"`

### Tests Run Slowly

- Reduce number of threads
- Increase ramp-up time
- Check server performance
- Disable unnecessary listeners during test runs

### Cookies Not Working

- Ensure Cookie Manager is enabled in Thread Group
- Check that `withCredentials` is set correctly
- Verify CORS settings on server allow credentials

## Additional Resources

- [JMeter Official Documentation](https://jmeter.apache.org/usermanual/index.html)
- [JMeter Best Practices](https://jmeter.apache.org/usermanual/best-practices.html)
- [JSON Path Syntax](https://goessner.net/articles/JsonPath/)

## Support

If you encounter issues:

1. Check server logs for backend errors
2. Review JMeter log file (usually in JMeter bin directory)
3. Verify all environment variables are set correctly
4. Ensure database connection is working

---

**Happy Testing!** 🚀
