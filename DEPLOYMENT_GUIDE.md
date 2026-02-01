# 🚀 Deployment Guide - Oura MCP Server

Your Oura MCP Server is now ready to deploy to the web! This guide covers multiple deployment options.

---

## 🌐 Why Deploy to Web?

**Benefits of web hosting:**
- ✅ Access from anywhere (mobile, web apps, other devices)
- ✅ Always available (no need to run locally)
- ✅ Share with team members or other applications
- ✅ Scalable infrastructure
- ✅ Automatic HTTPS and security

---

## 📦 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Perfect for:** Quick deployment, serverless, free tier available

#### Step-by-Step:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Navigate to project**:
   ```bash
   cd oura-mcp-server
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy**:
   ```bash
   vercel
   ```

   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? `oura-mcp-server` (or custom name)
   - Directory? `.` (current directory)
   - Override settings? **N**

5. **Add Environment Variable**:
   ```bash
   vercel env add OURA_ACCESS_TOKEN
   ```

   When prompted, paste your Oura access token.

6. **Set to production**:
   ```bash
   vercel --prod
   ```

7. **Done!** Your server is now live at: `https://your-project.vercel.app`

#### Test Your Deployment:

```bash
# Check health
curl https://your-project.vercel.app/health

# Test MCP endpoint
curl -X POST https://your-project.vercel.app/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

### Option 2: Railway

**Perfect for:** Always-on applications, databases, full control

#### Step-by-Step:

1. **Create Railway account**: https://railway.app

2. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

3. **Login**:
   ```bash
   railway login
   ```

4. **Initialize project**:
   ```bash
   cd oura-mcp-server
   railway init
   ```

5. **Add environment variables**:
   ```bash
   railway variables set OURA_ACCESS_TOKEN=your_token_here
   railway variables set TRANSPORT=http
   railway variables set NODE_ENV=production
   ```

6. **Deploy**:
   ```bash
   railway up
   ```

7. **Get your URL**:
   ```bash
   railway domain
   ```

   Railway will generate a URL like: `https://your-app.up.railway.app`

---

### Option 3: Render

**Perfect for:** Simple deployments, free tier, easy setup

#### Step-by-Step:

1. **Create account**: https://render.com

2. **Push code to GitHub**:
   ```bash
   # Create GitHub repo, then:
   git remote add origin https://github.com/yourusername/oura-mcp-server.git
   git push -u origin main
   ```

3. **In Render Dashboard**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Name**: `oura-mcp-server`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Add Environment Variables**:
       - `OURA_ACCESS_TOKEN` = your token
       - `TRANSPORT` = `http`
       - `NODE_ENV` = `production`

4. **Deploy** - Render will build and deploy automatically

---

### Option 4: Google Cloud Run

**Perfect for:** Enterprise, scalability, Google Cloud ecosystem

#### Step-by-Step:

1. **Create Dockerfile** (already included in project):
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   RUN npm run build
   ENV TRANSPORT=http
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and deploy**:
   ```bash
   gcloud run deploy oura-mcp-server \\
     --source . \\
     --region us-central1 \\
     --allow-unauthenticated \\
     --set-env-vars OURA_ACCESS_TOKEN=your_token,TRANSPORT=http
   ```

---

## 🔐 Environment Variables

**Required:**
- `OURA_ACCESS_TOKEN` - Your Oura API access token

**Optional:**
- `TRANSPORT` - Set to `http` for web hosting (default: `stdio`)
- `PORT` - Server port (default: `3000`)
- `NODE_ENV` - Set to `production` for production deployments

---

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-deployment-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "oura-mcp-server",
  "version": "1.0.0",
  "transport": "http",
  "tools": 9
}
```

### 2. List Available Tools
```bash
curl -X POST https://your-deployment-url.com/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### 3. Test Health Insights
```bash
curl -X POST https://your-deployment-url.com/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "oura_get_personal_info",
      "arguments": {
        "response_format": "json"
      }
    }
  }'
```

---

## 🔗 Using Your Deployed Server

### With Claude Desktop

Update your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "oura-web": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/client",
        "https://your-deployment-url.com/mcp"
      ]
    }
  }
}
```

### With API Clients

Your server is now accessible via standard HTTP requests:

```python
import requests

# List tools
response = requests.post(
    "https://your-deployment-url.com/mcp",
    json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list"
    }
)

# Get health insights
response = requests.post(
    "https://your-deployment-url.com/mcp",
    json={
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "oura_analyze_health_trends",
            "arguments": {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "include_recommendations": True
            }
        }
    }
)
```

---

## 📊 Monitoring Your Deployment

### Vercel
- Dashboard: https://vercel.com/dashboard
- View logs, analytics, and performance metrics
- Automatic HTTPS and edge caching

### Railway
- Dashboard: https://railway.app/dashboard
- Real-time logs and metrics
- Auto-scaling capabilities

### Render
- Dashboard: https://dashboard.render.com
- Health checks and uptime monitoring
- Automatic SSL certificates

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets
- ✅ Use environment variables for tokens
- ❌ Never commit `.env` file to git
- ✅ Use `.env.example` as template

### 2. Rotate Access Tokens
- Regenerate Oura access tokens periodically
- Update environment variables after rotation

### 3. Monitor Usage
- Check deployment logs regularly
- Set up alerts for errors
- Monitor API rate limits (5,000 requests/day)

### 4. Use HTTPS Only
- All platforms provide automatic HTTPS
- Never use HTTP for production

---

## 🐛 Troubleshooting

### Deployment Fails
- Check build logs for errors
- Ensure all dependencies are in `package.json`
- Verify `npm run build` works locally

### 401 Unauthorized Errors
- Verify `OURA_ACCESS_TOKEN` is set correctly
- Check token hasn't expired
- Ensure Oura membership is active

### Timeout Errors
- Oura API may be slow for large date ranges
- Use smaller date ranges in queries
- Consider implementing caching

### Out of Memory
- Increase memory allocation in platform settings
- Optimize data processing for large datasets

---

## 💡 Next Steps

### 1. Set Up Custom Domain
Most platforms allow custom domains:
- Vercel: Settings → Domains
- Railway: Settings → Domain
- Render: Settings → Custom Domain

### 2. Add Monitoring
Consider adding:
- Error tracking (Sentry)
- Analytics (Google Analytics)
- Uptime monitoring (Uptime Robot)

### 3. Scale Up
If you need more:
- Increase serverless function limits
- Add Redis for caching
- Implement rate limiting

---

## 🎉 You're Live!

Your Oura MCP Server is now accessible from anywhere in the world!

**Share your deployment:**
- Documentation page: `https://your-url.com`
- Health check: `https://your-url.com/health`
- MCP endpoint: `https://your-url.com/mcp`

**Start generating insights:**
```bash
curl -X POST https://your-url.com/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "oura_analyze_health_trends",
      "arguments": {
        "start_date": "2024-01-01",
        "end_date": "2024-01-31"
      }
    }
  }'
```

---

## 📚 Additional Resources

- **Oura API Docs**: https://cloud.ouraring.com/v2/docs
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs

---

**🚀 Happy deploying! Your evidence-based health insights are now globally accessible!**
