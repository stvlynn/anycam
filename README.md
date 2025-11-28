# AnyCam

AI Camera that lets you travel anywhere, anytime.

## Project Structure

- `frontend/`: React + Vite application
- `backend/`: Node.js + Express server

## Setup & Run

### Frontend

1. Navigate to `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
4. Configure environment variables:
   - Duplicate `.env.example` into `.env`
   - Set `VITE_API_BASE_URL` to where your backend is running (defaults to `http://localhost:3000`)
   - Add any future public keys with the `VITE_` prefix

### Backend

1. Navigate to `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file with your API keys:
   ```env
   NANO_BANANA_API_KEY=your_key_here
   ```
4. Run server:
   ```bash
   npm start
   ```

## Frontend ↔ Backend Integration

| Layer    | Config / Endpoint                 | Description |
|----------|-----------------------------------|-------------|
| Frontend | `VITE_API_BASE_URL=/api`          | Vite proxy forwards `/api/*` to backend (`vite.config.js`) |
| Backend  | `POST /api/upload`                | Accepts `multipart/form-data` with `photo`; returns temporary URL. |
| Backend  | `POST /api/generate`              | Accepts `{ photo, location, time }`; calls Nano Banana and returns `{ imageUrl, generationTime }`. |

### Local Dev Flow
1. Start backend (`npm start` in `/backend`).
2. Start frontend (`npm run dev` in `/frontend`). Vite proxy sends API calls to `localhost:3000`.
3. Frontend calls `VITE_API_BASE_URL + /upload` and `/generate` automatically via axios/fetch.

## Features

- **Selfie Upload**: Upload and compress your photo.
- **Location Selection**: Choose any place in the world.
- **Time Travel**: Pick a date and time of day.
- **AI Generation**: Generates a photorealistic image of you in that location.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, shadcn/ui, Lucide Icons
- **Backend**: Express, Axios, Multer
- **AI**: Nano Banana (Gemini 3 Pro Image Preview)
