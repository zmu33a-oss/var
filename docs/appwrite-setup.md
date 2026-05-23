# Appwrite Data-Only Setup

This project already reads Appwrite settings from Expo public environment variables in `src/lib/appwrite.ts`.

## What To Configure

Add the following values to `.env.local`:

- `EXPO_PUBLIC_APPWRITE_ENDPOINT`
- `EXPO_PUBLIC_APPWRITE_PROJECT_ID`
- `EXPO_PUBLIC_APPWRITE_PROJECT_NAME`
- `EXPO_PUBLIC_APPWRITE_PLATFORM`
- `EXPO_PUBLIC_APPWRITE_DATABASE_ID`
- `EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID`
- `EXPO_PUBLIC_APPWRITE_POSTS_COLLECTION_ID`
- `EXPO_PUBLIC_APPWRITE_PREDICTIONS_COLLECTION_ID`
- `EXPO_PUBLIC_APPWRITE_POINTS_COLLECTION_ID`
- `EXPO_PUBLIC_APPWRITE_SOCIAL_INTERACTIONS_COLLECTION_ID`

You can copy `.env.example` to `.env.local` and replace the placeholder values.

## Where To Get The Values

### Project

From Appwrite Console:

- Project Settings -> General -> Project ID
- Project Settings -> General -> Project Name
- Endpoint for Appwrite Cloud is usually `https://fra.cloud.appwrite.io/v1` unless your new subscription uses a different region or self-hosted endpoint

### Platform

If you run Expo Web, add a Web platform in Appwrite and allow:

- `localhost`
- `<your-local-ip>` when testing from a phone or another device on the same Wi‑Fi
- your deployed frontend hostname such as `var-var.vercel.app`

Appwrite's Web Platform field expects the hostname only. Do not include protocol, path, or port.

Examples:

- page opened from `http://localhost:8081` -> add `localhost`
- page opened from `http://192.168.1.100:8081` -> add `192.168.1.100`
- page opened from `https://var-var.vercel.app` -> add `var-var.vercel.app`

Keep `EXPO_PUBLIC_APPWRITE_PLATFORM` aligned with your app platform identifier if you also use native builds. The current project default is `com.xtik.webplus`.

### Database And Collections

Create one database, then create these collections:

- `profiles`
- `posts`
- `predictions`
- `points`
- `socialInteractions`

Then put each collection ID into its matching env variable.

## Minimum Fields Needed

### posts

- `title`
- `content`
- `authorId`

### profiles

- `userId`
- `varId`
- `displayVarId`
- `displayName`
- `username`
- `avatarUri`
- `role`

### predictions

- `varId`
- `title`
- `choice`
- `competition`
- `status`
- `lockedAt`
- `pointsAwarded`

### points

- `varId`
- `amount`
- `reason`
- `createdAt`

### socialInteractions

- `varId`
- `mode`
- `action`
- `targetId`
- `active`
- `value`

The app also stores user follow/unfollow here with `mode = profile`, `action = follow`, and `targetId = <followed user varId>`.

## Auth Note

Signup and login use Appwrite Account service, not database collections. That means auth will only work when:

- the project ID and endpoint are correct
- Email/Password auth is enabled in Appwrite
- the Web platform allows your local and production domains

## Minimum Permissions To Make The App Work

These are the minimum working permissions based on the code paths currently used by the app.

### posts

- `create`: any authenticated user
- `read`: any authenticated user
- `update`: owner or admin only
- `delete`: owner or admin only

If you want the X feed to be readable before login, make `read` public for this collection. If you keep it private, guests will only see local fallback content.

### profiles

- `read`: authenticated users at minimum
- `update`: owner or admin only

If profile data is sensitive, move to document-level permissions per user. Querying by `varId` alone does not enforce privacy.

This collection is the right place for a public/admin profile index, such as looking up a user by `displayVarId`. Keep sensitive account-only fields like phone, national ID, and birth date out of this collection unless you make permissions much stricter.

### predictions

- `read`: authenticated users at minimum
- `create/update/delete`: only the service or admin flow that writes prediction records

### points

- `read`: authenticated users at minimum
- `create/update/delete`: only the service or admin flow that writes points

### socialInteractions

- `create`: authenticated users
- `read`: authenticated users
- `update`: authenticated users at minimum
- `delete`: optional, only if you plan to delete records instead of toggling them inactive

## Password Recovery Note

The app can now send a password recovery email and complete the reset after the user returns from the Appwrite link. For this to work reliably:

- keep your web domain added in Appwrite Platforms -> Web
- if you use a custom reset URL later, add `EXPO_PUBLIC_APPWRITE_PASSWORD_RECOVERY_URL`
- make sure Appwrite email delivery is configured, otherwise recovery emails will not be sent

## After Updating Env

Restart Expo so `EXPO_PUBLIC_*` variables are reloaded.
