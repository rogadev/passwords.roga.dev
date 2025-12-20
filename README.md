# RogaDev Password Generator

A very simple, lightweight password generator that I built in an couple hours. It takes a few parameters that allow you to decide whether you'll have special characters, capital and/or lower case letters, and numbers. Click to save to clipboard.

The live application is available at [passwords.roga.dev](https://passwords.roga.dev).

## Features

- Generate random, secure passwords
- Customize password options (length, character sets)
- Exclude specific characters
- Apply common password rules
- Copy to clipboard with one click
- Network activity monitoring
- Fully client-side (no server requirements)
- URL parameter support for sharing configurations

## Development

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/roga-password-generator.git

# Navigate to the project directory
cd roga-password-generator

# Install dependencies
npm install
```

### Running the Application

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

### Testing

This project uses Vitest for unit testing and Playwright for end-to-end testing.

```bash
# Run unit tests (jsdom environment)
npm test

# Run unit tests in watch mode
npm run test:watch

# Run browser mode tests (real browser with Playwright)
npm run test:browser

# Run browser tests in watch mode
npm run test:browser:watch

# Run all tests (unit + browser)
npm run test:all

# Run end-to-end tests
npm run test:e2e

# Run end-to-end tests with UI
npm run test:e2e:ui
```

For more information on testing, see [TESTING.md](TESTING.md).

### CI/CD

This project uses GitHub Actions for continuous integration and Vercel for continuous deployment. The GitHub Actions workflows run tests automatically, and Vercel handles deployment when changes are merged to the main branch.

For more information on the CI/CD workflow, see [CI_CD.md](CI_CD.md).

## URL Parameters

You can configure the password generator via URL parameters:

```
?len=24                # Set password length to 24
?exLower               # Exclude lowercase letters
?exNum                 # Exclude numbers
?exUpper               # Exclude uppercase letters
?exSym                 # Exclude symbols
?exc=abc123            # Exclude specific characters
?ruleNoLead            # Disallow leading numbers/symbols
```

Parameters can be combined:

```
?len=18&exUpper&exSym&ruleNoLead&exc=xyz789
```

## License

MIT
