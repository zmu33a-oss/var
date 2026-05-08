Apple Wallet integration in this project now supports two paths:

1. Direct pass URL

Set `EXPO_PUBLIC_WALLET_PASS_URL` to an existing HTTPS `.pkpass` link. The profile screen will open that URL directly on iPhone when the user swipes to add the card.

2. Generated pass endpoint

Deploy the app with a public base URL, then set either:

- `EXPO_PUBLIC_WALLET_PASS_API_URL=https://your-domain.com/api/wallet-pass`
- or `EXPO_PUBLIC_APP_URL=https://your-domain.com`

When there is no direct `EXPO_PUBLIC_WALLET_PASS_URL`, the profile screen will build a request to `/api/wallet-pass` using the current profile fields and activity stats.

Server environment variables required by `api/wallet-pass.ts`:

- `APPLE_WALLET_PASS_TYPE_IDENTIFIER`
- `APPLE_WALLET_TEAM_IDENTIFIER`
- `APPLE_WALLET_ORGANIZATION_NAME`
- `APPLE_WALLET_WWDR_BASE64`
- `APPLE_WALLET_SIGNER_CERT_BASE64`
- `APPLE_WALLET_SIGNER_KEY_BASE64`
- `APPLE_WALLET_SIGNER_KEY_PASSPHRASE`

Optional server environment variables:

- `APPLE_WALLET_WEB_SERVICE_URL`
- `APPLE_WALLET_AUTH_TOKEN`

Certificate values can be either Base64 strings or PEM text with escaped newlines.

Notes:

- Apple Wallet requires a real signed `.pkpass`; a screenshot or a plain image of the card will not work.
- The add flow works on iPhone only.
- The endpoint is intended for deployment on Vercel. Expo Web local dev does not serve the `api/` route.
