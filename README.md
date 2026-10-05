# Rume mobile app

An iPhone and Android app for the Rume shop, built with Expo (React Native). It uses the **same backend API** as the website (`https://rume-delta.vercel.app/api/...`) and the **same Supabase account system**, so:

- signing in with Google on web and mobile gives the same account
- the bag is the same on both. Changes appear on the other device within about a second (Supabase Realtime), and the bag also refreshes whenever you open the Bag tab or return to the app
- saved measurements and order history are shared
- checkout uses the website's `/api/checkout` and Paystack

## Before you start

1. The **website update** (new API endpoints and the shared cart) must be deployed to Vercel first.
2. In **Supabase → SQL Editor**, run `supabase/migrations/002_cart.sql` from the website project. This creates the shared cart and switches on instant sync.
3. In **Supabase → Authentication → URL Configuration → Redirect URLs**, add:
   ```
   exp://**
   ```
   This lets Google sign-in return to the app while it runs in Expo Go.

## Run it on your iPhone

1. Install **Expo Go** from the App Store.
2. In this folder, copy `.env.example` to `.env` and fill in the three values:
   - `EXPO_PUBLIC_API_URL`: your live website, e.g. `https://rume-delta.vercel.app`
   - `EXPO_PUBLIC_SUPABASE_URL`: the same Project URL as the website's `.env.local`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: the same **publishable** key (`sb_publishable_…`). **Never** put the secret key in the app.
3. Open a terminal in this folder and run:
   ```
   npm install
   npx expo start
   ```
4. Open the iPhone **Camera**, point it at the QR code in the terminal, and tap the banner to open Expo Go.
   - The phone and computer must be on the **same Wi-Fi**. If Windows asks about the firewall for Node.js, click **Allow**.
   - If the phone still can't connect, stop with Ctrl + C and run `npx expo start --tunnel` instead (accept the prompt to install the tunnel helper).
5. After changing `.env`, restart with `npx expo start -c`. The `-c` clears the cache.

## Screens

- **Shop:** all products from `GET /api/products`, with the Nigeria ₦ / Worldwide $ switch
- **Product:** photos, the measurement form for that garment type (prefilled from the account), and Add to bag (`POST /api/cart`)
- **Bag:** the shared bag (`GET/PATCH/DELETE /api/cart`), with a live-sync indicator
- **Account:** Google sign-in, orders (`GET /api/me/orders`) and sign-out
- **Checkout:** contact and address, then `POST /api/checkout` and Paystack in a secure browser sheet

## How the shared login works

The app signs in with the same Supabase project and Google provider as the website. When it calls the website's API, it sends the Supabase access token as `Authorization: Bearer …`. The website checks that token with Supabase, the same check it runs on its own login cookie, so both clients are recognised as the same user.

## Demo checklist (for the screen recording)

1. On the laptop, sign in on the website with your Google account. On the iPhone, sign in in the app with **the same** account.
2. Open the **Bag** tab on the phone. The green dot should say **Live**.
3. On the **website**, add a piece with measurements. It appears in the phone's bag within about a second.
4. On the **phone**, change the quantity or remove the item. The website's bag updates instantly; keep the cart page open to show it.
5. Optional: add something on the phone, then show it in the website bag, and check out from either device with test card `4084 0840 8408 4081` (expiry `12/30`, CVV `408`, PIN `0000`, OTP `123456`).

## Recording on iPhone

- **Add Screen Recording to Control Center:** Settings → Control Center → add Screen Recording (or, on iOS 18, long-press in Control Center → Add a Control → Screen Recording).
- Swipe down from the top right, tap the record button, wait for the 3-second countdown, and do the demo. Tap the red indicator to stop. The video saves to Photos.
- **To show both screens in one video**, either:
  - film the laptop and phone together with a second phone, or
  - record the iPhone (screen recording) and the laptop (Windows **Win + G** → Capture) at the same time, then place them side by side in a free editor such as **CapCut**.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Almost there" screen listing missing settings | Fill in `.env`, then run `npx expo start -c` |
| Shop shows "Request failed" | Check `EXPO_PUBLIC_API_URL` is your live site with `https://` and no slash at the end, and that the website update is deployed |
| Google sign-in returns to a Safari error or doesn't come back | Add `exp://**` to Supabase Redirect URLs |
| "Access blocked" from Google | Add that Gmail as a test user in Google Cloud → Google Auth Platform → Audience |
| Bag doesn't update instantly | Make sure `002_cart.sql` ran. The bag still refreshes when you open the Bag tab |
| "Sign in to use your bag" error | The website update isn't deployed yet, or you're signed out; sign in again |
