# OAuth Setup Guide - Google & Facebook

Your OAuth code is ready! Now you need to configure the providers in Supabase.

## 🔧 Supabase Configuration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `tzftzmqntxnijkfvvtfz`
3. Go to **Authentication** → **Providers**

---

## 🔵 Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add **Authorized redirect URIs**:
     ```
     https://tzftzmqntxnijkfvvtfz.supabase.co/auth/v1/callback
     ```
   - Click "Create"
   - **Copy** the Client ID and Client Secret

### 2. Configure in Supabase

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Enable the toggle
4. Paste your **Client ID** and **Client Secret**
5. Click "Save"

---

## 🟦 Facebook OAuth Setup

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose app type: **Consumer**
4. Fill in app details:
   - App Name: "TikraKaina"
   - Contact Email: your email
5. Click "Create App"

### 2. Add Facebook Login Product

1. In your app dashboard, click "Add Product"
2. Find **Facebook Login** → Click "Set Up"
3. Choose "Web" platform
4. Skip the quickstart (we already have the code)

### 3. Configure OAuth Redirect

1. Go to **Facebook Login** → **Settings** (left sidebar)
2. Add **Valid OAuth Redirect URIs**:
   ```
   https://tzftzmqntxnijkfvvtfz.supabase.co/auth/v1/callback
   ```
3. Click "Save Changes"

### 4. Make App Public (Important!)

1. Go to **Settings** → **Basic** (left sidebar)
2. Copy your **App ID** and **App Secret**
3. Scroll down to "App Mode"
4. Switch from "Development" to **"Live"**
   - You may need to add a Privacy Policy URL
   - You can use a simple one like: `https://yourdomain.com/privacy`

### 5. Configure in Supabase

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Facebook** and click to expand
3. Enable the toggle
4. Paste your **App ID** (as Client ID) and **App Secret** (as Client Secret)
5. Click "Save"

---

## 🧪 Testing

### Test Google Login:
1. Go to http://localhost:3000
2. Click "Prisijungti" or "Registruotis"
3. Click the "Prisijungti su Google" button
4. You should be redirected to Google login
5. After successful login, you'll be redirected back to your app
6. Check browser console - you should see: `✅ Granted 1 free credit to new OAuth user: [user-id]`

### Test Facebook Login:
1. Same steps as Google
2. Click "Prisijungti su Facebook" button
3. Login with Facebook credentials
4. Check for the success message in console

### Verify Credits Were Granted:
```bash
source backend/.env
psql "postgresql://${SUPABASE_DB_USER}:${SUPABASE_DB_PASSWORD}@${SUPABASE_DB_HOST}:5432/postgres" -c "SELECT user_id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;"
psql "postgresql://${SUPABASE_DB_USER}:${SUPABASE_DB_PASSWORD}@${SUPABASE_DB_HOST}:5432/postgres" -c "SELECT user_id, credits FROM user_credits ORDER BY created_at DESC LIMIT 5;"
```

---

## ⚠️ Important Notes

1. **Redirect URLs**: Make sure the redirect URLs match exactly:
   - Supabase: `https://tzftzmqntxnijkfvvtfz.supabase.co/auth/v1/callback`
   - Don't use your custom domain for OAuth (use Supabase's URL)

2. **Facebook App Must Be Live**:
   - In development mode, only app admins can login
   - Switch to "Live" mode for public access

3. **Google+ API**:
   - Must be enabled, even though it's deprecated
   - Google still requires it for OAuth

4. **Email Verification**:
   - OAuth users are automatically verified
   - No email confirmation needed

5. **First-Time Credits**:
   - OAuth signups automatically get 1 free credit
   - Handled by `/app/auth/callback/route.ts`
   - Email signups also get 1 credit (handled in `AuthModal.tsx`)

---

## 🐛 Troubleshooting

**"Redirect URI mismatch"**
→ Double-check your redirect URLs match exactly

**"Invalid OAuth credentials"**
→ Make sure you copied the Client ID and Secret correctly

**Facebook shows "App Not Set Up"**
→ Your app is still in Development mode - switch to Live

**No credits granted**
→ Check browser console and server logs for errors

**"This app is in development mode"**
→ Facebook app needs to be set to Live mode

---

## 🎉 What's Implemented

✅ Google OAuth with proper branding
✅ Facebook OAuth with blue button
✅ Beautiful UI with "Arba el. paštu" divider
✅ Auto-credit initialization for new OAuth users
✅ Server-side session handling
✅ Seamless redirect flow
✅ Works with existing freemium system

All code is ready - just needs OAuth credentials! 🚀
