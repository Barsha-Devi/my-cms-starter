# The contact form, set up and looked after by you

This guide lets you connect the contact form, check that it works, and fix it if it stops, without anyone's help.

## The short version

1. Sign up at resend.com with the email address that should receive messages.
2. Create an API key in Resend.
3. In Vercel, add two settings and redeploy.
4. In your admin, press **Send me a test email**.

That is the whole job. It takes about ten minutes the first time and is then hands free.

## How it works

A visitor fills in your form. Your site passes the message to a small function that runs on Vercel. That function hands it to Resend, and Resend emails it to you. When you press Reply, your answer goes to the visitor, not to Resend.

Your email address is kept in Vercel's settings. It is not in your website, not in your code and not on GitHub.

## One-time setup

### 1. Sign up for Resend

1. Go to https://resend.com and choose **Sign up**.
2. Use the email address that should receive your messages. This matters. On the free plan, Resend only delivers to the email address you signed up with.
3. Open the confirmation email Resend sends and confirm your address.

### 2. Create an API key

1. In Resend, open **API Keys**, then **Create API Key**.
2. Name: your site's name.
3. Permission: **Sending access**.
4. Domain: **All domains** (you will not have one yet, and that is fine).
5. Press **Add** and copy the key straight away. It starts with `re_`. Resend shows it only once.

Keep the key private. Do not paste it into a chat, an email, a screenshot or GitHub.

### 3. Give two settings to Vercel

1. Open your project in Vercel, then **Settings**, then **Environment Variables**.
2. Add `RESEND_API_KEY`, and paste the key as the value.
3. Add `CONTACT_TO`, and type the email address that should receive messages. It must be the same address you used to sign up for Resend.
4. Leave **Production** ticked and save each one.
5. Open **Deployments**, find the newest one, press the three dots, choose **Redeploy**, and confirm. Settings only take effect on a new deployment.

### 4. Test it

1. Open your admin, then **Pages**, then **Contact**, then **Sending messages**.
2. It should say **Connected**. If it says "Not connected yet", go back to step 3.
3. Press **Send me a test email**.
4. Open your inbox. Check spam too. The email is called "Test from your site".
5. If it is in spam, open it and press **Not spam**. Do this once and later messages will land in your inbox.

Then send yourself a real message from your live Contact page, using a different email address as the sender, and check that Reply goes to that address.

## Day to day

Nothing. Messages arrive in your inbox from "Site contact". The subject looks like "New message from Ada (Let's work together)". Press Reply to answer. The reply goes to the visitor.

If you like, set up a Gmail filter so they stand out. In Gmail, search for `from:onboarding@resend.dev`, open the search options, choose **Create filter**, and tick **Star it** or apply a label.

## Looking after it

Every month or two, take two minutes.

- Open Resend and look at **Emails**. You should see your messages marked as delivered.
- The free plan allows 3,000 emails a month and 100 a day. A small personal site will never get close.
- Check that Vercel's **Settings**, **Environment Variables** still lists both settings.

## If something is wrong

| What you see | What it means | What to do |
| --- | --- | --- |
| Visitors see "the form is switched off right now" | The two settings are missing, or you have not redeployed since adding them | Check the spelling of `RESEND_API_KEY` and `CONTACT_TO`, then redeploy |
| The admin says "Not connected yet" | Same as above | Same as above |
| The test says "You can only send testing emails to your own email address" | `CONTACT_TO` is not the address you signed up to Resend with | Change `CONTACT_TO` to that address, then redeploy |
| The test says the key is invalid | The key was copied wrongly, or deleted | Create a new key, replace `RESEND_API_KEY`, redeploy |
| The test works but nothing arrives | The email went to spam, or is delayed | Check spam. Then look at Resend, **Emails**, to see whether it shows as delivered or bounced |
| A visitor says it did not go through | Resend refused it, or you hit the daily limit | Look at Resend, **Emails** for failures. In Vercel, open **Logs** and search for `contact` |
| A visitor sees "You have sent a few messages already" | They sent several messages within ten minutes | Nothing to do. It clears itself |
| Lots of junk messages | Spam | The form already blocks most robots. If it gets worse, tell whoever helps you with the site |

## Changing things

**Change where messages go.** On the free plan, only the address you signed up with works. To use a different address, either sign up to Resend again with that address and create a new key, or verify a domain in Resend, which is a paid-plan step for some uses. Then update `RESEND_API_KEY` and `CONTACT_TO` and redeploy.

**Replace the key.** In Resend, create a new API key. In Vercel, replace `RESEND_API_KEY` with it and redeploy. Then delete the old key in Resend. Do this straight away if the key is ever shown to anyone.

**Make the email come from your own address.** Verify a domain you own in Resend, then add a setting called `CONTACT_FROM` with a value like `My Site <hello@yourdomain.com>`. This is optional.

**Switch the form off.** Delete `RESEND_API_KEY` in Vercel and redeploy. Visitors then see the "switched off" note with your social links.

## What protects the form

- A hidden field that only robots fill in. Messages from robots are quietly dropped.
- A check that the form was not sent faster than a person could type.
- A limit of three messages per visitor every ten minutes. Typos do not count.
- Messages are only accepted from your own website.
- Messages are sent as plain text, and visitors cannot add recipients, copies or extra lines to the subject.

## A note for your visitors

Visitors' names, email addresses and messages pass through Resend on the way to you. A short line on your site saying so is good practice, especially for visitors in the EU.
