# Deploying FIC WorkForce Backend to Render

To make your application work on **any laptop**, you need a public backend URL. Render is a great free/cheap option.

## 1. Prepare your Backend
- Ensure your `backend/server.js` has the CORS fix (which I added) that allows your Vercel URL.
- Make sure all your Environment Variables (MONGODB_URI, etc.) are ready.

## 2. Create a New Web Service on Render
1. Go to [Render.com](https://render.com) and sign in.
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Set the following configurations:
   - **Name**: `fic-workforce-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

## 3. Add Environment Variables
In the **Environment** tab on Render, add these from your `.env` file:
- `MONGODB_URI`: (Your MongoDB connection string)
- `JWT_SECRET`: (Your secret key)
- `PORT`: `10000` (Render will override this, but good to have)
- `ADMIN_EMAIL`: `admin@forgeindiaconnect.com`
- `ADMIN_PASSWORD`: `Forgeindia@09`

## 4. Update Vercel Frontend
Once Render gives you a URL (e.g., `https://fic-backend.onrender.com`), go to your **Vercel Dashboard**:
1. Select your project > **Settings** > **Environment Variables**.
2. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://fic-backend.onrender.com/api`
3. Redeploy your frontend.

**Now your app will work on every laptop in the world!**
