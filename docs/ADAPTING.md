# Adapting it to your own site

The idea is simple. The admin edits JSON files in `content/`. Your site reads those same files. Anything that can read JSON can use this editor.

This guide covers the shape of each file, how the live preview works, and how to add your own content types.

## The content files

### `content/site.json`

Settings for the whole site.

```json
{
  "brand": "Your Name",
  "nav": [{ "label": "Writing", "url": "#writing" }],
  "social": [{ "label": "LinkedIn", "url": "https://..." }],
  "about": {
    "heading": "Hi, I am Your Name.",
    "paragraphs": ["First paragraph.", "Second paragraph."],
    "facts": [{ "label": "Work", "text": "What you do", "url": "#contact" }],
    "showSocial": true,
    "clients": { "title": "Companies I have worked with", "items": [{ "name": "Example Co", "src": "img/logo.svg", "url": "https://..." }] }
  },
  "contact": { "heading": "...", "intro": "...", "showSocial": true, "formKey": "" },
  "footer": { "prompt": "...", "ctaLabel": "...", "ctaUrl": "#contact", "links": [], "copyright": "..." },
  "pages": { "home": { "heading": "Notes on the [things] I am learning." }, "writing": {}, "photos": {}, "quotes": {} },
  "fonts": { "home-h1": "Playfair Display" },
  "analytics": { "gaId": "" }
}
```

Words in square brackets inside a heading are shown highlighted in yellow. The keys in `fonts` are the ids of elements in the page, and the values are font names from `fonts.js`.

### `content/photos.json`

A list, newest first.

```json
{ "img": "img/first.jpg", "place": "Shown on hover", "caption": "Optional", "when": "March 2026", "story": ["Paragraph one."], "slug": "first-place" }
```

The `slug` becomes the web address, `/#photo/first-place`.

### `content/writing.json`

A list of articles. An article written on your site has `"pub": "site"` and a `body`. An article published elsewhere has the name of the website in `pub` and a link in `u`.

```json
{ "d": "2026-03-01", "pub": "site", "t": "Title", "x": "Short summary", "slug": "my-article", "body": ["Paragraph.", "## Small heading", "> Highlighted line"] }
{ "d": "2026-02-01", "pub": "medium.com", "u": "https://medium.com/...", "t": "Title", "x": "Short summary", "slug": "elsewhere" }
```

Inside body text, a blank line starts a new paragraph, `## ` makes a small heading, and `> ` makes a highlighted line.

### `content/quotes.json`

```json
{ "q": "The quote.", "a": "Who said it", "u": "https://link-to-the-source", "d": "2026-03-01" }
```

### `content/pages.json`

Extra sections on the built-in pages, and your own pages.

```json
{
  "extra": { "home": [], "about": [{ "type": "text", "text": "Added in the editor." }] },
  "custom": [{ "slug": "services", "title": "Services", "showTitle": true, "blocks": [{ "type": "heading", "level": "2", "text": "What I do" }] }]
}
```

A custom page is reached at `/#page/services`. The block types are `heading`, `text`, `image`, `gallery`, `video`, `button`, `quote`, `columns`, `list`, `embed`, `divider` and `spacer`. Their fields are defined in the `BLOCKS` object in `admin.html` and drawn by `renderBlocks` in `index.html`.

## Pictures

Uploaded photos are shrunk in the browser to at most 1800 pixels and saved as JPEG. Logos are kept as SVG or PNG, and a logo on a white background is converted to a transparent one automatically.

The server only accepts files under `img/` with the extensions jpg, jpeg, png, webp and svg. SVG files containing scripts, event handlers or embedded objects are refused.

## How the live preview works

The admin shows your site in a frame at `/index.html?preview=1&edit=1`.

1. Before it loads the frame, the admin writes all unsaved content into `sessionStorage` under `previewData`. This is an object with one entry per content file, plus `__images`, which maps a picture's path to its data for pictures that have not been uploaded yet.
2. In preview mode the site reads `previewData` instead of fetching the files. See the `load` helper at the top of the script in `index.html`.
3. With `edit=1`, the site makes text editable. When you type, the site sends the admin a message with `window.parent.postMessage({ source: "site-edit", type: "edit", file, path, value }, location.origin)`. The admin applies it to its copy of the data.
4. Changes to the font bar send `type: "font"`, and leaving a field sends `type: "blur"`.

To use the click-to-edit feature on a different design, keep the same element ids and the `bindEdit` calls in `index.html`, and change the HTML and CSS around them. The simplest route to your own design is to restyle this `index.html`.

## Add your own content type

For a list type such as `projects`, you touch four places.

1. Create `content/projects.json` with an empty list `[]`.
2. In `api/content.js`, add `"projects"` to the `FILES` list. This is the allow-list of files the admin may read and write.
3. In `admin.html`, add an entry to `SCHEMAS` describing its fields, and add it to the `LIST_HASH` object and to the list on the home screen (look for `["photos", "writing", "quotes"]`). Each field has a `k` (the key), a `label` and an optional `type` (`textarea`, `paras`, `select`, `image`, `url` or `date`).
4. In `index.html`, load it (add `load("projects")` to the first `Promise.all`) and draw it. Use the `esc` helper for any text that goes into `innerHTML`.

The list screen, the edit screen, reordering, saving and the live preview then work for the new type with no further changes.

## Removing what you do not need

- **Tracking and the link builder.** Delete the `trackView` code in `admin.html` and the Google Analytics block in `index.html`. With no ID set, nothing is loaded.
- **The team feature.** Delete `api/team.js`, the `teamView` code in `admin.html` and the `team/` folder. The owner named in `ALLOWED_USER` can still sign in.
- **The logo wall.** Remove the `clients` section from `index.html` and `clientsEditor` from `admin.html`.

## Fonts

`fonts.js` lists the fonts offered and builds the Google Fonts address for the ones in use. Add a name to `FONT_LIST` to offer another Google font. Fonts with a single weight go in `SINGLE_WEIGHT`.

## Development and tests

`npm run dev` starts the local server in `dev/server.js`. It runs the real code in `api/`, but stores everything in the files on your disk and signs you in automatically. `npm test` starts it against a temporary copy and checks sign in, saving, conflicts, file safety and the team list.
