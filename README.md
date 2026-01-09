# Whatapp OTP Sender

## Overview

Below is a small, drop-in TypeScript “package module” you can copy into your backend. It keeps one long-lived WhatsApp Web session (high performance: no re-login per request), and exposes the exact API you asked for:
sendVerificationCode(otp: string, phoneE164: string) ✅ two params

## Usage

Here is the test code for using this module

```ts
import express from "express";
import { WhatsAppOtpSender } from "../../packages/wa-otp-sender/dist/index.js";

const app = express();
app.use(express.json());

// Create ONE instance for the whole app (important for performance).
const otpSender = new WhatsAppOtpSender({
  clientId: "staging-1",
  authDataPath: "./.wwebjs_auth",
  allowOtpLength: 4,
  puppeteer: {
    headless: true,
    // executablePath: "/usr/bin/google-chrome", // optionally set on servers
  },
  template: "Your Sellit code is {otp}. It expires in 10 minutes.",
});

// Initialize once on startup (first run shows QR in terminal).
await otpSender.init();

app.post("/send-otp", async (req, res) => {
  try {
    const { otp, phoneE164 } = req.body;
    await otpSender.sendVerificationCode(otp, phoneE164);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Unknown error" });
  }
});

app.listen(3000, () => console.log("Server running on :3000"));
```

## Operational notes

First run prints a QR code; scan it with the WhatsApp account you want to send from.

Session is persisted via LocalAuth (so you don’t scan QR every restart).
docs.wwebjs.dev

Keep the WhatsApp client as a singleton. Creating a new client per request will be slow and unstable.

The curl command for sending OTP:

```bash
curl -XPOST -H 'Content-Type: Application/json' -d '{"otp": "1988", "phoneE164": "+601139000023"}' http://localhost:3000/send-otp
```
