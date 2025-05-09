// Import required packages
const { App } = require("@slack/bolt");
const axios = require("axios");
const express = require("express");
require("dotenv").config();

// Create Express app
const expressApp = express();
expressApp.use(express.json());

// Initialize your Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false, // Disable socket mode
  port: process.env.PORT || 3000,
  customRoutes: [
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
    console.log('Listening for "should I deploy today" messages...');

    // Add a general message listener to debug all incoming messages
    app.message(async ({ message, say }) => {
      console.log("Received message:", message.text);
      // Don't respond here, just log
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
