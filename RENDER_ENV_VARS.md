# Render Environment Variables Guide

Here are the environment variables you need to add to your Render dashboard.

## 1. Backend Service (Web Service)

Go to **Environment** tab in your Render Web Service and add these:

| Variable Key | Value Example | Description |
|--------------|---------------|-------------|
| `NODE_ENV` | `production` | Optimizes performance |
| `PORT` | `10000` | Render default port is usually 10000 |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Connection String |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | From Google Cloud Console |
| `FRONTEND_URL` | `https://your-frontend-app.vercel.app` | **CRITICAL:** Start with `https://`, no trailing slash |
| `SESSION_TTL_DAYS` | `30` | Session duration |
| `OTP_TTL_MINUTES` | `10` | OTP validity duration |
| `OTP_MAX_ATTEMPTS` | `3` | Max OTP retries |
| `TWILIO_ACCOUNT_SID` | `AC...` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | `[Hidden]` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | `+1234567890` | Your Twilio Number |
| `GEMINI_API_KEY` | `AIza...` | Google Gemini API Key |
| `SENDGRID_API_KEY` | `SG...` | SendGrid API Key (if using email) |
| `SENDGRID_FROM_EMAIL` | `noreply@krushimitra.online` | Verified Sender Email |

### ⚠️ Special: Google Cloud Service Account Key
For `GOOGLE_APPLICATION_CREDENTIALS`, you cannot just paste the file path.
**Option:**
1.  **Render "Secret Files"**: Upload your `service-account-key.json` as a "Secret File" named `google-credentials.json` in `/etc/secrets/`.
2.  Set `GOOGLE_APPLICATION_CREDENTIALS` to `/etc/secrets/google-credentials.json`.

---

## 2. Frontend (Static Site / Vercel)

If deploying frontend to Render (Static Site) or Vercel:

| Variable Key | Value Example | Description |
|--------------|---------------|-------------|
| `EXPO_PUBLIC_BACKEND_URL` | `https://your-backend-app.onrender.com` | **CRITICAL:** The URL of your deployed Backend |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `...apps.googleusercontent.com` | Same as Backend `GOOGLE_CLIENT_ID` |
| `EXPO_PUBLIC_APP_SCHEME` | `krushimitra` | App deep linking scheme |

### 💡 Important Notes
-   **URLs**: Ensure `FRONTEND_URL` (in Backend) matches the actual URL of your Frontend.
-   **URLs**: Ensure `EXPO_PUBLIC_BACKEND_URL` (in Frontend) matches the actual URL of your Backend.
-   **Re-deploy**: After adding variables, you must manually trigger a deploy for them to take effect.
