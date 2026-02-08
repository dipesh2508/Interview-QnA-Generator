# InterviewPrep AI

🚀 **AI-Powered Interview Preparation Platform for Developers**

InterviewPrep AI is a comprehensive platform that helps developers prepare for technical interviews through AI-generated questions, mock interview sessions, and detailed performance analytics.

## ✨ Features

- **🤖 AI-Generated Questions**: Generate personalized interview questions for Python, Java, C++, and JavaScript
- **🎯 Mock Interviews**: Practice with timed sessions and receive detailed feedback
- **📊 Progress Tracking**: Monitor your performance across different topics and difficulty levels
- **🎨 Multiple Categories**: Coding, System Design, Behavioral, and Computer Science Fundamentals
- **⚡ Real-time Feedback**: Instant scoring and improvement suggestions
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + Hooks

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **AI Integration**: Google Gemini API

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Google Gemini API Key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/dipesh2508/Interview-QnA-Generator.git
cd Interview-QnA-Generator
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

3. **Setup Frontend**
```bash
cd ../frontend
npm install
npm run dev
```

4. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
InterviewPrep AI/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/# Reusable UI components
│   │   ├── contexts/  # React contexts
│   │   └── lib/       # Utilities and API client
├── backend/           # Express.js backend API
│   ├── src/
│   │   ├── controllers/# Route handlers
│   │   ├── models/    # MongoDB schemas
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic
│   │   └── utils/     # Helper functions
└── README.md
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [Google Gemini](https://ai.google.dev/)
- Icons from [Lucide React](https://lucide.dev/) and [React Icons](https://react-icons.github.io/react-icons/)

---

**Happy Coding! 🎉**