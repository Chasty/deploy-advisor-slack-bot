# 🚀 Slack Deploy Advisor Bot

A sassy and helpful Slack bot that advises on deployment timing and best practices, with a special focus on preventing Friday deployments! Built with Node.js, Slack Bolt, and Google's Gemini AI.

## ✨ Features

- 🤖 Smart deployment advice with a sassy attitude
- 🚫 Strong opinions about Friday deployments
- 🎯 Context-aware responses in threads
- 🤖 Powered by Google's Gemini AI for engaging conversations
- 🎨 Meme-style responses with relevant emojis
- 🔄 Rate limiting and retry logic for API calls

## 🛠️ Tech Stack

- Node.js
- Slack Bolt Framework
- Google Gemini AI API
- Express.js
- Axios

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- A Slack workspace
- Google Gemini API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_SIGNING_SECRET=your_slack_signing_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

### Installation

1. Clone the repository:

```bash
git clone [your-repo-url]
cd deploy-advisor
```

2. Install dependencies:

```bash
npm install
```

3. Start the bot:

```bash
npm start
```

## 🤖 Bot Commands

The bot responds to various deployment-related questions:

- "Can I deploy now?"
- "Should I deploy today?"
- "Is it okay to deploy on Friday?" (Don't even think about it! 😅)

### Thread Conversations

- The bot maintains context in threads
- Follow-up questions are handled by Gemini AI
- Responses are kept concise and engaging

## 🧪 Testing

You can test the Gemini API integration locally using the test endpoint:

```bash
curl -X POST http://localhost:3001/test-gemini \
  -H "Content-Type: application/json" \
  -d '{"message": "What are some best practices for deployment?"}'
```

## 🔧 Configuration

### Rate Limiting

The bot includes built-in rate limiting to prevent API overload:

- Base delay: 5 seconds between requests
- Exponential backoff for retries
- Maximum retry attempts: 3

### Response Style

- Single-line responses
- Meme-friendly tone
- Relevant emojis
- Sassy but helpful attitude

## 🚀 Deployment

The bot is designed to be deployed on platforms like Render. Make sure to:

1. Set up all environment variables
2. Configure the health check endpoint
3. Set up proper logging

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Slack Bolt Framework
- Google Gemini AI
- The DevOps community for the Friday deployment memes
