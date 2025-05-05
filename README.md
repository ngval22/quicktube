QuickTube

A web application that generates summaries of YouTube video transcripts using OpenAI's gpt-4o-mini.


Features

Enter a YouTube URL to get a concise summary (100-150 words).
History section to view past summaries.
Built with React 18, Tailwind CSS, and Node.js.


Setup

Clone the repository:git clone https://github.com/your-username/youtube-summarizer.git
cd youtube-summarizer


Install dependencies:npm install
cd backend
npm install


Create backend/.env with your OpenAI API key:echo "OPENAI_API_KEY=your_github_token_here" > backend/.env


Build Tailwind CSS:npx tailwindcss -i ./frontend/input.css -o ./frontend/output.css


Start the backend:cd backend
npm start


Start the frontend:cd ..
http-server frontend/ -p 8080


Open http://localhost:8080 in your browser.

Dependencies

Backend: express, youtube-transcript, dotenv, cors, node-fetch
Frontend: React 18, Tailwind CSS, Babel


