# My CMS Starter

A small, free content management system for personal and portfolio sites.

Your content lives as plain JSON files in your own GitHub repository. The admin page edits those files and saves each change as a commit. Your host (Vercel's free plan works well) redeploys the site a minute later.

There is no database, no server to look after, no build step and no dependencies. You own every word and every file.

## What you get

**A live visual editor.** The editor sits on the left and your real site sits on the right. Click any text on the page and type straight into it. One Save button at the top saves everything.

**Pages and sections.** Edit the text of every page section by section, and add your own sections to any page or build whole new pages from blocks (headings, text, images, galleries, YouTube and Vimeo videos, buttons, quotes, lists, embeds and ready-made layouts). Drag blocks to reorder them.

**Content types.** Photos (each with its own story and its own web address), articles (written on your site or linking to where they were published), quotes (each linking to its source) and a "companies I have worked with" logo wall.

**Design controls.** A font picker with 42 free Google Fonts on every piece of text, plus menu, footer, About and Contact editors.

**A contact form that emails you.** Messages are sent through Resend's free plan, with spam protection built in and a button in the admin to send yourself a test. Your email address stays in your hosting settings, never in the code.

**Teams.** Add people by GitHub username. They sign in with their own GitHub account. They need no keys and no access to your repository.

**Tracking.** Optional Google Analytics with each page, photo and article counted separately, and a UTM link builder for the links you share.

**Safe by default.** Text from the content files is escaped before it is shown, links are checked, uploaded SVG logos are inspected, and saves are limited to the content and image folders.

## Try it in one minute

You need [Node.js](https://nodejs.org) 18 or newer. No GitHub account and no setup.

```bash
git clone <this repository>
cd my-cms-starter
npm run dev
```

Open http://localhost:3000/admin.html. You are signed in automatically. Changes you save are written to the `content/` and `img/` folders on your computer.

Run the checks with `npm test`.

## Put it online

The full walkthrough is in [docs/SETUP.md](docs/SETUP.md). In short:

1. Put this project in a GitHub repository (use "Use this template" or fork it).
2. Import the repository into Vercel.
3. Create a GitHub OAuth app (the "Sign in with GitHub" button) and a fine-grained access token (how saves are made).
4. Add four settings in Vercel and redeploy.

Then open `https://your-site/admin.html` and sign in.

## How it works

```
Your browser  ->  /api (small serverless functions)  ->  GitHub  ->  new commit  ->  your host redeploys
```

- The site is a single `index.html` that reads the files in `content/` and draws the pages.
- `admin.html` is the editor. It shows your real site in a frame and passes your unsaved edits to it, which is why you see changes instantly.
- The functions in `api/` sign people in with GitHub, check that they are allowed, and read or write files in your repository through the GitHub API.

## What is in the box

| Path | What it is |
| --- | --- |
| `index.html` | The demo site (pages, photo pop-ups, sections, tracking) |
| `admin.html` | The visual editor |
| `fonts.js` | The list of fonts offered in the editor |
| `content/` | Your content as JSON (site settings, photos, writing, quotes, extra pages) |
| `img/` | Your pictures and logos |
| `team/users.json` | The people you have added (not published to the web) |
| `api/` | Sign in, read and save content, manage the team |
| `dev/` | The local development server and the checks |
| `docs/` | Setup, contact form and customisation guides |

## Use it with your own design

The demo site is deliberately plain. The editor does not care what your site looks like, only that your site reads the same content files. See [docs/ADAPTING.md](docs/ADAPTING.md) for the shape of each file, how to add your own content types, and how the live preview talks to your site.

## Good to know

- **Saves are commits.** Each save appears in your repository history with the editor's name, so any change can be undone.
- **Saves take a minute to appear** on the live site, because the host rebuilds after each commit.
- **Web addresses use `#`**, for example `/#photo/first-place`. They work for sharing and for analytics, but link previews on social networks show your general site details rather than the individual photo.
- **It is built for small sites.** Think personal sites, portfolios and small publications, not large editorial teams or sites that need approval workflows.
- **Private repositories work.** Saving uses your access token, so nothing needs to be public.

## Contributing

Issues and pull requests are welcome. Please run `npm test` before you open one. The project has no dependencies on purpose, so please keep it that way.

## License

[MIT](LICENSE)
