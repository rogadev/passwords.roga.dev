# Testing URL Parameters in Password Generator

This document explains how to run tests that verify URL parameters are correctly applied to the password generator.

## Test Overview

We've implemented two main types of tests:

1. **Unit Tests** - Testing the URL parameter parsing in isolation
2. **End-to-End Tests** - Testing the complete flow including:
   - URL parameter processing and application
   - UI controls reflecting parameter values
   - Generated passwords adhering to constraints
   - Network monitoring functionality

## Running Unit Tests

Unit tests verify that the `getParamsFromURL` function correctly parses URL parameters and returns the expected settings object.

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch
```

## Running End-to-End Tests

End-to-end tests use Playwright to verify the application's behavior from a user's perspective.

Before running E2E tests, you need to start the development server:

```bash
# Start the development server
npm run dev

# In a separate terminal, run E2E tests
npm run test:e2e

# Alternatively, run E2E tests with UI
npm run test:e2e:ui
```

## Test Cases

### URL Parameter Tests

You can manually test URL parameters by appending them to your localhost URL:

#### Basic length change:

```
http://localhost:5173/?len=24
```

#### Exclude character types:

```
http://localhost:5173/?exLower&exNum
```

This excludes lowercase letters and numbers.

#### Specific excluded characters:

```
http://localhost:5173/?exc=abc123
```

This excludes the characters a, b, c, 1, 2, and 3.

#### Combined settings:

```
http://localhost:5173/?len=32&exSym&exc=%40%23%24
```

This sets length to 32, excludes symbols, and specifically excludes @, #, and $ (URL encoded).

#### Rule application:

```
http://localhost:5173/?ruleNoLead&len=15
```

This applies the rule to disallow leading numbers/symbols and sets length to 15.

#### Everything at once:

```
http://localhost:5173/?len=18&exUpper&exSym&ruleNoLead&exc=xyz789
```

This sets length to 18, excludes uppercase letters and symbols, disallows leading numbers/symbols, and excludes the characters x, y, z, 7, 8, and 9.

### Network Monitoring Test Case

Our end-to-end tests also verify the network monitoring functionality:

- When a user clicks "Ping Google", the request should be logged in the network monitor
- The response should appear in the log with latency information
- A success message with latency should be displayed in the UI

## Expected Behavior

### URL Parameters

When URL parameters are present:

1. The application should read the parameters on initial load
2. The UI controls should reflect the parameter values
3. The generated password should adhere to the constraints specified by the parameters

Changes to options after initial load should NOT update the URL - this is intended behavior based on the current implementation.

### Network Monitoring

When using the network monitoring panel:

1. Clicking "Ping Google" should send a HEAD request
2. The request should appear in the network log
3. The response should appear in the network log with latency information
4. A success message with latency should be displayed
