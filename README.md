# Eduvulcan API Parser

A tool for parsing API responses from Eduvulcan.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Deployment to Vercel

This application is configured to work with Vercel deployment. The API proxy functionality is implemented using Vercel Serverless Functions in the `/api` directory.

### How it works

When deployed to Vercel:

1. The API routes defined in the `/api` directory handle requests to:
   - `/api/ap`
   - `/logowanie`
   - `/Account/QueryUserInfo`

2. These routes proxy the requests to the actual Eduvulcan API, preserving cookies and headers.

3. The `vercel.json` file configures the routing for these API endpoints.

### Common Issues

#### Receiving HTML instead of API data

If you're receiving the HTML of your own application instead of the API data when making requests, it's likely because:

1. The local development proxy doesn't work in production
2. The Vercel API routes are not correctly set up

Make sure:
- All API routes in the `/api` directory are properly implemented
- The `vercel.json` file is correctly configured
- The correct endpoints are being used in the application code

## Features

- Login to Eduvulcan using proxy or direct methods
- View parsed API data
- View raw HTML response
- Copy tokens, parsed data, and raw HTML to clipboard
- Decode JWT tokens

## Technology

- React
- TypeScript
- Vite
- Axios
- Vercel Serverless Functions
