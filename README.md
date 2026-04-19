# Twilio-to-Gemini

A tiny Vercel webhook that receives an incoming SMS from Twilio, sends the message to Gemini, and replies back to the sender using TwiML.

## What this does

1. A user texts your Twilio number.
2. Twilio sends an HTTP webhook request to `/api/sms`.
3. Vercel calls Gemini.
4. The function returns TwiML.
5. Twilio sends the SMS reply back automatically.

## Files

- `api/sms.js` — the only backend endpoint
- `.env.example` — environment variables to set in Vercel
- `vercel.json` — function timeout config

## Environment variables

Set these in Vercel Project Settings → Environment Variables:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` = `gemini-2.5-flash`
- `SYSTEM_PROMPT` = your assistant instructions

## Create the repo

Create a new empty GitHub repo named:

`Twilio-to-Gemini`

Then upload these files or push them with git.

## Deploy to Vercel

1. Import the GitHub repo into Vercel.
2. Add the environment variables.
3. Deploy.
4. Copy your production endpoint:

`https://YOUR-PROJECT.vercel.app/api/sms`

## Connect Twilio

In Twilio, open your phone number settings and set the incoming message webhook to:

`https://YOUR-PROJECT.vercel.app/api/sms`

Use method: `POST`

## Local test

If you want local testing:

```bash
npm install
vercel dev
```

Then point Twilio to your public dev tunnel URL if needed.

## Notes

- This is the shortest possible MVP.
- It does **not** verify the Twilio request signature yet.
- It does **not** store conversation history.
- It trims replies to roughly SMS-friendly length.

## Next upgrades

- Twilio signature verification
- basic allowlist for approved sender numbers
- conversation memory with KV / Upstash / Supabase
- switch between Gemini and GPT by environment variable
