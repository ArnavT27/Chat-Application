# JMeter Quick Start Guide

## Quick Setup (5 minutes)

### 1. Install JMeter

```bash
# macOS
brew install jmeter

# Or download from: https://jmeter.apache.org/download_jmeter.cgi
```

### 2. Start Your Backend

```bash
cd server
npm start
# Server should be running on http://localhost:8000
```

### 3. Open Test Plan

1. Launch JMeter
2. `File` → `Open` → Select `jmeter-test-plan.jmx`

### 4. Configure Variables

1. Click **Test Plan** in left panel
2. Update User Defined Variables:
   - `TEST_EMAIL`: Your test email (must be unique)
   - `TEST_PASSWORD`: Your test password
   - `SERVER_HOST`: `localhost` (default)
   - `SERVER_PORT`: `8000` (default)

### 5. Run Tests

- Click **Start** button (▶) or press `Ctrl+R` / `Cmd+R`
- View results in **View Results Tree** and **Summary Report**

## Test Groups

### Authentication Tests

Tests all auth endpoints in sequence:

1. Signup → Login → Check Auth → Verify Email → Forgot Password → Update Profile → Logout

### Message API Tests

Tests message endpoints (requires authentication):

1. Login → Get Users → Get Messages → Send Message → Mark as Seen

## Quick Troubleshooting

| Issue                               | Solution                                          |
| ----------------------------------- | ------------------------------------------------- |
| Signup fails: "User already exists" | Change `TEST_EMAIL` to a new email                |
| 401 Unauthorized                    | Make sure Login test runs first                   |
| Connection refused                  | Verify server is running on port 8000             |
| JSON Path errors                    | Update JMeter to 5.0+ or install JSON Path plugin |

## Key Features

✅ **Cookie Management**: Automatically handles JWT tokens  
✅ **Variable Extraction**: Extracts user IDs and message IDs automatically  
✅ **Assertions**: Validates response codes and JSON structure  
✅ **Organized**: Tests grouped by functionality

## Next Steps

- Read full guide: `JMETER_TESTING_GUIDE.md`
- Customize test data in User Defined Variables
- Add performance tests by increasing thread count
- Export results for analysis

---

**Need Help?** Check `JMETER_TESTING_GUIDE.md` for detailed instructions.
