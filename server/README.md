# OpenAI Proxy Server

This Express server provides a secure backend API route for your Play Any Card Game app to call OpenAI without exposing your API key to the frontend.

## Usage

1. Make sure you have your OpenAI API key in the root `.env` file:
   ```env
   OPENAI_API_KEY=sk-...
   ```
2. Install dependencies:
   ```sh
   cd server
   npm install
   ```
3. Start the server:
   ```sh
   npm start
   ```
   The server will run on http://localhost:3001 by default.

4. From your frontend, POST to `/api/openai` with `{ idea: "..." }` in the body.

---
**Never expose your OpenAI API key to the frontend or commit it to public repositories.**
