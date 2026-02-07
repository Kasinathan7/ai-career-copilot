# 🚀 GitHub Pages Deployment Guide

## ✅ Steps to Enable GitHub Pages

1. **Go to your repository**: https://github.com/Kasinathan7/ai_resume

2. **Settings → Pages**:
   - Click on **Settings** tab
   - Scroll down to **Pages** in the left sidebar
   - Under **Source**, select: **GitHub Actions**
   
3. **Trigger Deployment**:
   - The deployment will start automatically on your next push
   - Or go to **Actions** tab and manually run the "Deploy to GitHub Pages" workflow

4. **Your site will be live at**: 
   ```
   https://kasinathan7.github.io/ai_resume/
   ```

## ⚠️ Important: Backend Deployment Required

GitHub Pages only hosts **static frontend** files. You need to deploy your **backend** separately.

### Backend Deployment Options:

#### Option 1: Render (Free Tier - Recommended)
1. Go to https://render.com
2. Create new **Web Service**
3. Connect your GitHub repository
4. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables from `backend/.env`
5. Copy the deployed URL (e.g., `https://your-app.onrender.com`)
6. Update `frontend/.env.production`:
   ```
   VITE_API_URL=https://your-app.onrender.com/api
   ```
7. Commit and push to redeploy frontend

#### Option 2: Railway (Free $5 credit)
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repository and `backend` folder
4. Add environment variables
5. Get the deployment URL
6. Update frontend `.env.production`

#### Option 3: Heroku
```bash
cd backend
heroku create your-app-name
git subtree push --prefix backend heroku main
```

#### Option 4: VPS (DigitalOcean, AWS, etc.)
- Deploy backend on your server
- Use PM2 to keep it running
- Set up nginx reverse proxy
- Get SSL certificate with Let's Encrypt

## 📝 After Backend Deployment

1. Update `frontend/.env.production` with your backend URL:
   ```env
   VITE_API_URL=https://your-backend-url.com/api
   ```

2. Commit and push:
   ```bash
   git add frontend/.env.production
   git commit -m "Update production API URL"
   git push origin main
   ```

3. GitHub Actions will automatically rebuild and redeploy your frontend

## 🔧 Local Development

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Backend:
```bash
cd backend
npm install
npm start
```

## 📦 Manual Build & Preview

```bash
cd frontend
npm run build
npm run preview
```

## 🎯 Features

- ✅ Single-page ATS-optimized PDF generation
- ✅ Resume analysis and scoring
- ✅ AI-powered career suggestions
- ✅ Mock interview practice
- ✅ Job search integration
- ✅ Real-time chat interface

## 🔐 Environment Variables

Make sure to set these in your backend deployment:

```env
MONGODB_URI=your_mongodb_connection_string
GOOGLE_API_KEY=your_google_gemini_api_key
JWT_SECRET=your_jwt_secret
PORT=5002
```

## 📞 Need Help?

Check the GitHub Actions logs if deployment fails:
- Go to **Actions** tab in your repository
- Click on the latest workflow run
- Check for errors in the logs

---

Happy deploying! 🎉
