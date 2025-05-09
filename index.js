// Import required packages
const { App } = require("@slack/bolt");
const axios = require("axios");
const express = require("express");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

// Initialize Google AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Rate limiting configuration
const RATE_LIMIT_DELAY = 5000; // 5 seconds between requests
let lastRequestTime = 0;

// Create Express app for testing
const testApp = express();
testApp.use(express.json());

// Test endpoint for Gemini
testApp.post("/test-gemini", async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Testing Gemini API with message:", message);
    const response = await getGeminiResponse(message);
    console.log("Gemini API response:", response);

    res.json({ response });
  } catch (error) {
    console.error("Error in test-gemini endpoint:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start the test server
const TEST_PORT = 3001;
testApp.listen(TEST_PORT, () => {
  console.log(`Test server running on port ${TEST_PORT}`);
});

// Create Express app for Slack
const expressApp = express();
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

// Initialize your Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false, // Disable socket mode
  port: process.env.PORT || 3000,
  customRoutes: [
    {
      path: "/",
      method: ["GET", "HEAD"],
      handler: (req, res) => {
        res.writeHead(200);
        res.end("Slack Deploy Advisor Bot is running!");
      },
    },
    {
      path: "/test-gemini",
      method: ["POST"],
      handler: async (req, res) => {
        try {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });

          req.on("end", async () => {
            try {
              console.log("Raw request body:", body); // Debug log
              const data = JSON.parse(body);
              const { message } = data;

              if (!message) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: "Message is required" }));
                return;
              }

              console.log("Testing Gemini API with message:", message);
              const response = await getGeminiResponse(message);
              console.log("Gemini API response:", response);

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ response }));
            } catch (parseError) {
              console.error("Error parsing request body:", parseError);
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Invalid JSON body" }));
            }
          });
        } catch (error) {
          console.error("Error in test-gemini endpoint:", error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }));
        }
      },
    },
    {
      path: "/slack/events",
      method: ["POST"],
      handler: (req, res) => {
        // Handle the Slack Events API challenge
        if (req.body && req.body.challenge) {
          console.log("Received Slack challenge request");
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end(req.body.challenge);
          return;
        }

        // Handle other events
        console.log("Received Slack event:", req.body);
        res.writeHead(200);
        res.end("OK");
      },
    },
    {
      path: "/health",
      method: ["GET"],
      handler: (req, res) => {
        try {
          res.writeHead(200);
          res.end("OK");
        } catch (error) {
          console.error("Health check error:", error);
          res.writeHead(500);
          res.end("Error");
        }
      },
    },
  ],
});

// Add error handler for the Slack app
app.error(async (error) => {
  console.error("Slack app error:", error);
  // Attempt to reconnect
  try {
    await app.stop();
    await app.start();
    console.log("Successfully reconnected to Slack");
  } catch (reconnectError) {
    console.error("Failed to reconnect:", reconnectError);
  }
});

// Friday deployment messages with meme-style responses and emojis
const fridayMessages = [
  "Deploying on Friday? That's a bold strategy, Cotton. Let's see if it pays off! 🔥🫠",
  "Friday deploy? Your weekend must not have any plans yet! 📅❌",
  "ERROR 42: FRIDAY DEPLOYMENT ATTEMPT DETECTED. SYSTEM OVERRIDDEN BY COMMON SENSE. 🚫🤖",
  "Weekend plans: canceled. Server monitoring: scheduled. 💻🚨",
  "Friday deployments are like horror movies - most end badly! 🧟‍♂️🔪",
  "Deploy on Friday and find out what true fear feels like! 😱💔",
  "Why ruin one day when you can ruin your entire weekend? 🔥🏠🚶‍♂️",
  "Friday deployment detected. Would you like to auto-schedule your weekend support shift? ⏰😭",
  "Deploy on Friday? *grabs popcorn* 🍿👀",
  "Your Friday deployment has been automatically converted to a Monday task. You're welcome. ✅📆",
  "Friday + Deployment = Regret. It's just math. 🧮😢",
  "Ah, I see you chose chaos today! 🌪️🔥",
  "Deploy on Friday: Because what's life without a little weekend adrenaline? 💉💪",
  "That sound you hear is your future self crying. 👻😭",
  "Press F to pay respects to your weekend. ⌨️🪦",
];

// Other day messages with positive emojis
const otherDayMessages = [
  "The skies look clear for deployment today! ☀️✅",
  "Systems are go for deployment! 🚀👍",
  "Deploy away, today seems fine! 🌈💯",
  "All signals point to yes for deployment today. 📊👌",
  "No Friday detected, deployment permitted. 📅✅",
  "Launch sequence initiated! You're good to go. 🚀🔥",
  "Deploy with confidence today! 💪🌟",
  "Release the kraken! Today's a good day for it. 🐙✨",
  "Deployment forecast: Smooth sailing ahead ⛵🌤️",
  "Green light for deployment! 🟢🚦",
  "Ship it! The deployment gods are smiling today. 🙏📦",
];

// Function to get a random message from an array
function getRandomMessage(messageArray) {
  return messageArray[Math.floor(Math.random() * messageArray.length)];
}

// Random emoji arrays for extra flair
const dangerEmojis = [
  "🔥",
  "💥",
  "⚠️",
  "🚨",
  "☠️",
  "🫠",
  "🤯",
  "😱",
  "🧨",
  "💣",
  "🤦‍♂️",
  "🙈",
];
const safeEmojis = [
  "✅",
  "🚀",
  "🎯",
  "🔔",
  "🌈",
  "💪",
  "👏",
  "🙌",
  "🥳",
  "🏆",
  "🌟",
  "✨",
];

// Function to add random emoji(s) to a message for extra flair
function addRandomEmojis(message, isRisky) {
  const emojiArray = isRisky ? dangerEmojis : safeEmojis;
  const numEmojis = Math.floor(Math.random() * 2) + 1; // 1 or 2 emojis

  let emojis = "";
  for (let i = 0; i < numEmojis; i++) {
    const randomIndex = Math.floor(Math.random() * emojiArray.length);
    emojis += " " + emojiArray[randomIndex];
  }

  // 30% chance to add special combined emoji
  if (Math.random() < 0.3) {
    if (isRisky) {
      emojis += " 🔥👨‍💻🔥"; // Coder on fire for risky deployments
    } else {
      emojis += " 🏄‍♂️🌊"; // Smooth sailing for safe deployments
    }
  }

  return message + emojis;
}

// Function to check if it's Friday
function isFriday(timezone = "UTC") {
  const now = new Date();
  const options = { timeZone: timezone, weekday: "long" };
  const dayOfWeek = new Intl.DateTimeFormat("en-US", options).format(now);
  return dayOfWeek === "Friday";
}

// Special extra dramatic messages for when someone explicitly asks about Friday deployment
const explicitFridayMessages = [
  "*EMERGENCY ALERT*: Friday deployment attempt detected! This is not a drill! 🚨🚨🚨",
  "Friday deployment? *Everyone exits the chat simultaneously* 👋💨",
  "Let me check my calendar... *sees it's Friday*... *dramatic gasp* 😱🗓️",
  "I've alerted the incident team about your Friday deployment plans 📱🚑",
  "Computer says *ABSOLUTELY NOT* 🖥️🔴",
  "According to the ancient scrolls of DevOps, Friday deployments are forbidden 📜⛔",
  "*Plays funeral march* 🎵⚰️",
];

// Add special handler for explicit Friday deployment questions
app.message(
  /(?:should|can|could)\s+(?:i|we|you)\s+(?:deploy|release|push|ship)\s+(?:on|this)\s+friday/i,
  async ({ message, say }) => {
    console.log("Received explicit Friday deployment question:", message.text);
    try {
      const dramaticMessage = getRandomMessage(explicitFridayMessages);
      await say({
        text: dramaticMessage,
        thread_ts: message.ts,
      });

      // Add a GIF for extra emphasis with a slight delay
      setTimeout(async () => {
        await say({
          text: "https://media.giphy.com/media/d10dMmzqCYqQ0/giphy.gif",
          thread_ts: message.ts,
        });
      }, 1000);
    } catch (error) {
      console.error("Error in Friday message handler:", error);
      await say({
        text: "I can't even process the thought of a Friday deployment! 🤯",
        thread_ts: message.ts,
      });
    }
  }
);

// Function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to get Gemini's response with retry logic
async function getGeminiResponse(message, retryCount = 0) {
  try {
    // Rate limiting with exponential backoff
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
    const waitTime = Math.max(
      RATE_LIMIT_DELAY - timeSinceLastRequest,
      backoffDelay
    );

    if (waitTime > 0) {
      console.log(`Waiting ${waitTime}ms before making request...`);
      await delay(waitTime);
    }
    lastRequestTime = Date.now();

    const config = {
      responseMimeType: "text/plain",
    };
    const model = "gemini-2.0-flash";
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `You are a sassy DevOps assistant who LOVES to roast Friday deployments. 
            The user asked: "${message}". 
            Respond in ONE line only, be direct and sassy, include 1-2 relevant emojis. 
            For Friday deployments, roast them hard! For other topics, be sassy but helpful.`,
          },
        ],
      },
    ];

    console.log("Making request to Gemini API...");
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullResponse = "";
    for await (const chunk of response) {
      fullResponse += chunk.text;
    }
    return fullResponse;
  } catch (error) {
    console.error("Error getting Gemini response:", error);

    // Retry logic for rate limiting with exponential backoff
    if (error.message.includes("429") && retryCount < 3) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
      console.log(`Rate limited, retrying in ${retryDelay / 1000} seconds...`);
      await delay(retryDelay);
      return getGeminiResponse(message, retryCount + 1);
    }

    // If we've exhausted retries or it's a different error, return a fallback response
    return (
      "I'm a bit busy right now, but here's what I know about deployments:\n" +
      "1. Avoid Friday deployments 🚫\n" +
      "2. Always have a rollback plan 🔄\n" +
      "3. Test thoroughly before deploying ✅\n" +
      "Try asking again in a moment! 🤖"
    );
  }
}

// Handle variations of deployment/release questions
app.message(
  /(?:should|can|could)\s+(?:i|we|you)\s+(?:deploy|release|push|ship)\s+(?:today|now|this\s+time)(?:\?)?/i,
  async ({ message, say }) => {
    console.log("Received deployment question:", message.text);
    try {
      // Get user's timezone from Slack if possible
      let userInfo;
      try {
        userInfo = await app.client.users.info({
          user: message.user,
        });
      } catch (error) {
        console.error("Error fetching user info:", error);
      }

      const timezone = userInfo?.user?.tz || "UTC";

      // Option 1: Use your own logic
      if (isFriday(timezone)) {
        const responseMessage = getRandomMessage(fridayMessages);
        // Even though the messages already have emojis, we'll add even more random ones for variety
        await say({
          text: addRandomEmojis(responseMessage, true),
          thread_ts: message.ts, // This makes it a thread reply
        });
      } else {
        const responseMessage = getRandomMessage(otherDayMessages);
        await say({
          text: addRandomEmojis(responseMessage, false),
          thread_ts: message.ts, // This makes it a thread reply
        });
      }

      // Option 2: Use the shouldideploy.today API
      try {
        const response = await axios.get(
          `https://shouldideploy.today/api/slack?tz=${timezone}`
        );
        if (response.data && response.data.text) {
          await say({
            text: response.data.text,
            thread_ts: message.ts, // This makes it a thread reply
          });
        }
      } catch (error) {
        console.error("Error fetching from shouldideploy.today API:", error);
        // If API fails, we've already sent our own message above
      }
    } catch (error) {
      console.error("Error in message handler:", error);
      await say(
        "I'm having trouble deciding if you should deploy today. Maybe that's a sign? 🤔"
      );
    }
  }
);

// Start the app
(async () => {
  try {
    // Start the Slack app
    await app.start();
    console.log("⚡️ Slack bot is running!");
    console.log("Listening for messages...");

    // Add a general message listener
    app.message(async ({ message, say }) => {
      console.log("Received message:", message.text);
      console.log("Message details:", {
        channel: message.channel,
        user: message.user,
        ts: message.ts,
        type: message.type,
      });

      try {
        // Check if it's a deployment-related question
        if (message.text.toLowerCase().includes("deploy")) {
          // Use existing deployment logic
          const timezone = "UTC"; // You can get this from user settings if needed
          if (isFriday(timezone)) {
            const responseMessage = getRandomMessage(fridayMessages);
            await say({
              text: addRandomEmojis(responseMessage, true),
              thread_ts: message.ts,
            });
          } else {
            const responseMessage = getRandomMessage(otherDayMessages);
            await say({
              text: addRandomEmojis(responseMessage, false),
              thread_ts: message.ts,
            });
          }
        } else {
          // Use Gemini for other questions
          console.log("Calling Gemini API for message:", message.text);
          const geminiResponse = await getGeminiResponse(message.text);
          console.log("Received Gemini response:", geminiResponse);
          await say({
            text: geminiResponse,
            thread_ts: message.ts,
          });
        }
      } catch (error) {
        console.error("Error processing message:", error);
        await say({
          text: "Oops! Something went wrong. Please try again later. 🤖",
          thread_ts: message.ts,
        });
      }
    });

    // Keep-alive mechanism
    const keepAlive = async () => {
      try {
        const response = await axios.get(
          `http://localhost:${process.env.PORT || 3000}/health`,
          {
            timeout: 5000,
            validateStatus: function (status) {
              return status >= 200 && status < 500;
            },
          }
        );
        console.log(
          "Keep-alive ping sent:",
          response.status === 200 ? "OK" : "Failed"
        );
      } catch (error) {
        console.error("Keep-alive ping failed:", error.message);
      }
    };

    // Send keep-alive ping every 5 minutes
    setInterval(keepAlive, 5 * 60 * 1000);
    // Send initial ping
    keepAlive();

    // Handle process termination
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      await app.stop();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT received. Shutting down gracefully...");
      await app.stop();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", async (error) => {
      console.error("Uncaught Exception:", error);
      await app.stop();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", async (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      await app.stop();
      process.exit(1);
    });
  } catch (error) {
    console.error("Error starting the app:", error);
    process.exit(1);
  }
})();
