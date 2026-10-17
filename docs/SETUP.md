# Setup guide

This takes about 15 minutes the first time. You will create four things.

1. A GitHub repository that holds your site and your content.
2. A Vercel project that publishes it.
3. A GitHub OAuth app, which powers the "Sign in with GitHub" button.
4. A GitHub access token, which is how saves are made.

You do not need to know how to code.

## 1. Create your repository

Use the "Use this template" button on this project's GitHub page, or fork it. Choose a name for your site. The repository can be private.

## 2. Publish it with Vercel

1. Sign in at https://vercel.com with your GitHub account (the free Hobby plan is enough).
2. Choose **Add New**, then **Project**, and import your repository.
3. Leave every setting as it is and press **Deploy**.

When it finishes you will have an address such as `https://your-site.vercel.app`. Open it and you will see the demo site.

Vercel fills in your repository's owner and name for you, so there is nothing to set for those.

## 3. Create the "Sign in with GitHub" app

1. Go to https://github.com/settings/developers, choose **OAuth Apps**, then **New OAuth App**.
2. Application name: anything you like.
3. Homepage URL: your site address, for example `https://your-site.vercel.app`.
4. In the **Redirect URI** box (older forms call it Authorization callback URL), enter your address followed by `/api/callback`, for example `https://your-site.vercel.app/api/callback`.
5. Leave **Enable Device Flow** off, and turn **Expire user access tokens** off.
6. Press **Register application**.
7. Copy the **Client ID**. Then press **Generate a new client secret** and copy it straight away, because GitHub shows it only once.

## 4. Create the access token

Saves are made with this token, so the people you add never need access to your repository.

1. Go to https://github.com/settings/personal-access-tokens/new
2. Token name: anything you like. Expiration: the longest offered.
3. Under **Repository access** choose **Only select repositories** and pick your site's repository.
4. Under **Repository permissions** set **Contents** to **Read and write**. Leave everything else alone. **Metadata** shows as read-only and cannot be changed, which is expected.
5. Press **Generate token** and copy it straight away.

## 5. Give the settings to Vercel

In your Vercel project open **Settings**, then **Environment Variables**, and add these four.

| Key | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | The Client ID from step 3 |
| `GITHUB_CLIENT_SECRET` | The client secret from step 3 |
| `GITHUB_TOKEN` | The token from step 4 |
| `ALLOWED_USER` | Your GitHub username |

Then open **Deployments**, choose the newest one, and press **Redeploy**. Settings only take effect on a new deployment.

Never paste these values into a chat, an issue or a commit. A template is in `.env.example`.

## 6. Sign in

Open `https://your-site.vercel.app/admin.html` and press **Sign in with GitHub**. Edit something and press **Save to site**. About a minute later the live site shows your change.

## 7. Add other people (optional)

Open the admin, then **Whole site**, then **Team**. Type a GitHub username and press **Add to the team**. Send them the admin address. They press **Sign in with GitHub** and they are in.

Team members can edit everything. Only you, the owner named in `ALLOWED_USER`, can add or remove people. Removing someone locks them out within about 30 seconds.

## 8. Optional extras

**Receive messages from the Contact form.** Create a free key at https://web3forms.com using the email address that should receive messages. In the admin open **Pages**, **Contact**, and paste the key into **Form access key**.

**Count visits.** Create a free Google Analytics property, copy the Measurement ID (it starts with `G-`), and paste it into **Whole site**, **Tracking and links**. The same screen has a link builder that adds UTM tags to the links you share.

**Use your own domain.** Add it in Vercel under **Settings**, **Domains**. Then update the OAuth app's Homepage URL and Redirect URI to the new address.

## If something goes wrong

| What you see | What it means |
| --- | --- |
| "Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET" on the sign in page | The settings are missing, or you have not redeployed since adding them |
| "Could not tell which repository to edit" | You are not deploying from GitHub to Vercel. Add `GITHUB_OWNER` and `GITHUB_REPO` |
| "This GitHub account is not on the team" | The username is not in `ALLOWED_USER` or the Team list |
| "Could not read from GitHub (Not Found)" | The token cannot see the repository. Check the repository and the Contents permission |
| "Saving is not set up yet" | `GITHUB_TOKEN` is missing |
| The Team screen says "Not ready yet" | `GITHUB_TOKEN` is missing, so the list cannot be stored |
| Sign in works but the page shows no content | Open the browser's developer tools and check that the `content/*.json` files load |
| Saving stops working after a long time | The token expired. Create a new one and replace `GITHUB_TOKEN` |

## Settings reference

| Key | Required | Meaning |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | yes | OAuth app Client ID |
| `GITHUB_CLIENT_SECRET` | yes | OAuth app client secret |
| `GITHUB_TOKEN` | yes | Fine-grained token with Contents read and write |
| `ALLOWED_USER` | yes | GitHub username of the owner |
| `GITHUB_OWNER` | no | Repository owner. Filled in by Vercel |
| `GITHUB_REPO` | no | Repository name. Filled in by Vercel |
| `GITHUB_BRANCH` | no | Branch to edit. Defaults to `main` |

If your repository belongs to a GitHub organisation, `GITHUB_OWNER` will be the organisation, so set `ALLOWED_USER` to your own username.
