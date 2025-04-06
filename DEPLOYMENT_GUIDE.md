# Deployment Guide

## Backend Server Setup

### Option 1: Railway.app (Recommended)
1. Go to [railway.app](https://railway.app) and sign up
2. Create new project → Connect GitHub repo
3. Select your server/ directory
4. Add environment variables:
   - `ADMIN_PASSWORD` (set a secure password)
   - `MONGODB_URI` (your MongoDB connection string)
5. Deploy!

### Option 2: Render.com
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repo
4. Configure:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add environment variables
6. Deploy

## Frontend Configuration
1. Update `API_URL` in admin.html to your deployed server URL
2. Commit and push changes to GitHub
3. GitHub Pages will automatically deploy the frontend

## Local Development
1. Install dependencies:
```bash
cd server && npm install
```

2. Start server:
```bash
node server.js
```

3. Access admin panel at:
```
http://localhost:5000/admin.html
```

## Security Notes
- Never commit .env files
- Use strong passwords
- Monitor your MongoDB usage
- Consider adding HTTPS
