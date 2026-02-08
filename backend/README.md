# InterviewPrep AI - Backend

Backend API for the InterviewPrep AI platform, built with Node.js, Express, and MongoDB.

## Features

- **Question Generation**: AI-powered question generation using Google Gemini
- **User Management**: Authentication and user profile management
- **Interview Sessions**: Mock interview management and scoring
- **Analytics**: Performance tracking and insights

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **AI**: Google Gemini API
- **Validation**: Joi/Zod

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Interviews
- `POST /api/interviews/generate` - Generate new interview
- `GET /api/interviews` - Get user's interviews
- `GET /api/interviews/:id` - Get specific interview

### Mock Sessions
- `POST /api/mock/start` - Start mock interview session
- `POST /api/mock/submit` - Submit answer
- `GET /api/mock/:id` - Get session details

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start MongoDB and run the server:
```bash
npm run dev
```

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `GEMINI_API_KEY` - Google Gemini API key
- `PORT` - Server port (default: 5000)