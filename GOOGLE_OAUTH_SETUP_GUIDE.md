# Google OAuth Setup Guide for KrushiMitra

This guide explains how to properly configure Google OAuth for both backend and frontend applications.

## Backend Configuration

### 1. Set up Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or newer People API)

### 2. Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. For Application Type, select "Web application"
4. Add authorized redirect URIs:
   - For development: `http://localhost:3000`, `exp://localhost:19000`, `https://auth.expo.io/@your-username/your-app-slug`
   - For production: `https://yourdomain.com`, `krushimitra://auth/google/callback`

### 3. Configure Backend Environment Variables

Update your backend `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
FRONTEND_URL=https://yourdomain.com  # or http://localhost:3000 for development
```

## Frontend Configuration

### 1. Configure App Scheme

In your `app.json` or `app.config.js`, add the scheme:

```json
{
  "expo": {
    "scheme": "krushimitra",
    ...
  }
}
```

### 2. Configure Environment Variables

Update your frontend `.env` file:

```env
# Backend Configuration
EXPO_PUBLIC_BACKEND_URL=https://your-backend-domain.com

# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_APP_SCHEME=krushimitra
```

## Important Notes

1. **Redirect URIs**: Make sure all redirect URIs used in your app are registered in Google Cloud Console
2. **Client ID Type**: Use the "Web application" client ID, not Android or iOS specific ones
3. **Testing**: For mobile apps built with Expo, you might need to register special redirect URIs like `exp://`, `your-app-scheme://`, etc.
4. **Production Deployment**: Update your Google Cloud Console with production URLs before deploying

## Troubleshooting

- **401 Unauthorized**: Usually caused by incorrect client ID/secret or unregistered redirect URI
- **Invalid Grant**: Often due to mismatched redirect URIs between frontend and Google Cloud Console
- **Network Errors**: May occur if the backend cannot reach Google's servers

## Mobile-Specific Considerations

For Expo managed workflow, the redirect URI format might vary:
- Development: `exp://your-expo-username.expo.app`
- Standalone app: `your-scheme://path`
- Custom development: `your-scheme://path`

Remember to add all these variations to your Google Cloud Console OAuth configuration.