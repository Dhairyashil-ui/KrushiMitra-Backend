# Quick Start Guide - Google OAuth Setup

This is a condensed version of the full setup guide. For complete details, see `GOOGLE_OAUTH_SETUP_GUIDE.md`.

## Prerequisites
- Google Cloud Console account
- Vercel account (for deployment)
- MongoDB database

## 5-Minute Setup

### 1. Google Cloud Console (2 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **OAuth consent screen** → Configure as External
5. Go to **Credentials** → Create OAuth 2.0 Client ID
   - Type: **Web application**
   - Authorized JavaScript origins:
     ```
     https://www.krushimitra.online
     http://localhost:8081
     ```
   - Authorized redirect URIs:
     ```
     https://www.krushimitra.online/auth/google/callback
     http://localhost:8081/auth/google/callback
     ```
6. **Copy your Client ID and Client Secret**

### 2. Backend Setup (1 minute)

1. Create `.env` file in `KrushiMitra-Backend/`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add:
   ```env
   GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
   FRONTEND_URL=https://www.krushimitra.online
   MONGODB_URI=your_mongodb_uri
   ```

### 3. Frontend Setup (1 minute)

1. Create `.env` file in `krushimitra-frontend/`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add:
   ```env
   EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
   ```

### 4. Vercel Deployment (1 minute)

**Frontend:**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add:
  - `EXPO_PUBLIC_BACKEND_URL`
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

**Backend:**
- Add:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `FRONTEND_URL`
  - `MONGODB_URI`

### 5. Test It!

**Local:**
```bash
# Terminal 1 - Backend
cd KrushiMitra-Backend
npm start

# Terminal 2 - Frontend
cd krushimitra-frontend
npm run web
```

**Production:**
- Visit `https://www.krushimitra.online`
- Click "Continue with Google"
- Sign in and verify it works!

## What Was Changed?

### Backend (`KrushiMitra-Backend/server.js`)
- ✅ Added Google OAuth2Client for token verification
- ✅ Updated `/auth/google` endpoint to verify ID tokens
- ✅ Proper session management

### Frontend (`krushimitra-frontend/app/auth/login.tsx`)
- ✅ Added "Continue with Google" button
- ✅ Implemented OAuth flow using expo-auth-session
- ✅ Token exchange and backend verification
- ✅ Session storage

### New Files Created
- ✅ `components/GoogleIcon.tsx` - Google logo component
- ✅ `GOOGLE_OAUTH_SETUP_GUIDE.md` - Complete guide
- ✅ `.env.example` files for both frontend and backend

## Troubleshooting

**"redirect_uri_mismatch"**
- Check that redirect URIs in Google Console match exactly
- No trailing slashes

**"Invalid token"**
- Verify Client ID matches in frontend and backend
- Check that token is being sent correctly

**CORS errors**
- Verify `FRONTEND_URL` in backend .env
- Check CORS configuration in server.js

## Next Steps

1. ✅ Set up environment variables
2. ✅ Test locally
3. ✅ Deploy to Vercel
4. ✅ Test in production
5. 📝 Create privacy policy page
6. 📝 Create terms of service page
7. 📝 Publish OAuth consent screen (for 100+ users)

## Support

For detailed instructions, see `GOOGLE_OAUTH_SETUP_GUIDE.md`

---

**Status**: ✅ Implementation Complete - Ready for Configuration
