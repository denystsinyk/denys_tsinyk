# Spotify Refresh Token Setup Runbook

## Overview

The Spotify `recently-played` endpoint requires the OAuth Authorization Code Flow, which needs a one-time browser-based user consent step. This produces a long-lived `refresh_token` that the pipeline stores as a GitHub Secret and exchanges for a short-lived access token on every cron run.

This runbook covers the complete setup: creating a Spotify app, performing the one-time OAuth flow in a browser, exchanging the authorization code for a refresh token via curl, and storing all three secrets in your GitHub repository.

---

## Prerequisites

- A Spotify account (free or premium)
- Access to https://developer.spotify.com/dashboard
- Access to GitHub repo Settings > Secrets and variables > Actions

---

## Step 1 — Create a Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Click **Create app**
3. Fill in:
   - **App name:** anything descriptive (e.g. "Portfolio Data")
   - **App description:** anything
   - **Redirect URI:** `http://127.0.0.1:3000/callback` (exact match required — copy-paste this value)
4. Under **APIs used**, check **Web API**
5. Agree to the Developer Terms of Service and click **Save**
6. On the app overview page, click **Settings**
7. Copy the **Client ID** and reveal + copy the **Client Secret** — you will need both

---

## Step 2 — Build the Authorization URL

Construct the following URL, replacing `YOUR_CLIENT_ID` with your app's Client ID:

```
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcallback&scope=user-read-recently-played&state=xyz
```

1. Paste this URL into a browser where you are logged into your Spotify account
2. Click **Agree** on the permissions page
3. The browser will redirect to `http://127.0.0.1:3000/callback?code=LONG_CODE&state=xyz`
4. The server does not need to be running — just copy the `code` value from the URL bar

The `code` value will look like a long alphanumeric string. Copy everything after `code=` and before `&state=`.

---

## Step 3 — Exchange the Code for a Refresh Token

Run the following curl command in your terminal, replacing the three placeholders:

```bash
curl -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $(echo -n 'YOUR_CLIENT_ID:YOUR_CLIENT_SECRET' | base64)" \
  -d "grant_type=authorization_code&code=YOUR_CODE&redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcallback"
```

The response JSON will contain a `refresh_token` field:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "AQABC...",
  "scope": "user-read-recently-played"
}
```

Copy the `refresh_token` value — this is your `SPOTIFY_REFRESH_TOKEN`.

> Note: The authorization code (`code`) is single-use and expires in minutes. If the curl command fails, repeat Step 2 to get a new code.

---

## Step 4 — Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add these three secrets:

| Secret name              | Value                                  |
|--------------------------|----------------------------------------|
| `SPOTIFY_CLIENT_ID`      | Client ID from Step 1                  |
| `SPOTIFY_CLIENT_SECRET`  | Client Secret from Step 1              |
| `SPOTIFY_REFRESH_TOKEN`  | Refresh token from Step 3 response     |

---

## Step 5 — Verify

After adding all three secrets:

1. Go to your GitHub repository → **Actions** → **Refresh Data**
2. Click **Run workflow** → **Run workflow** (manual trigger)
3. Watch the run. The **Fetch Spotify data** step should complete without errors
4. After the run, check `public/data.json` in the commit — it should contain a `spotify` key with `recent_tracks` populated and `spotify_ok: true`

---

## Refresh Token Rotation Warning

Spotify may occasionally return a new `refresh_token` in the token exchange response. If the pipeline log shows:

```
Spotify returned a new refresh token — update SPOTIFY_REFRESH_TOKEN secret manually: <token>
```

You must update the `SPOTIFY_REFRESH_TOKEN` GitHub Secret with the new value immediately. Ignoring this warning will eventually cause pipeline failures once the old refresh token is revoked.
