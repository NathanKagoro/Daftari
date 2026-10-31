# Daftari

A sales book for very small shops: one owner, one phone, a short list of products. Swahili and English. It works offline and installs on the phone like an app.

Live: https://daftari-book.netlify.app (to be replaced by Daftari version 2).

## How it works

- **Data lives on the phone** (IndexedDB, falling back to localStorage) and syncs both ways with the owner's own **Google Sheet** through a Google Apps Script web app, whenever there is internet.
- **Each install is private to its sheet.** `config.js` leaves `syncUrl` empty, so a new install asks for its own sync link before it opens. The sync link works like a password: anyone who has it can read and write that sheet, so share it only with the owner.
- **Setup per shop** takes about 10 minutes: a blank Google Sheet with the sync script, and its web app link given to the owner.

Screens: Overview (profit, sales, items sold, money owed, how profit is worked out, where the profit goes, chart, by product), Sales, Costs (purchases and losses), Customers (with regulars who are due), More (products, profit split, Google Sheet link, backup, tutorial).

## Files

| File | What it is |
|---|---|
| `index.html` | The page |
| `app.js` | The whole app: storage, sync, maths, screens, tutorial |
| `styles.css` | Styles |
| `config.js` | Per-copy settings (sync link left empty on purpose) |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline and install-as-app |
| `fonts/` | Anton and Barlow, served locally |
| `_headers` | Netlify headers |

The Google Apps Script that sits behind each sheet is not in this repo yet.

## Run it

Serve the folder with any static server, e.g. `python3 -m http.server`, and open http://localhost:8000.

## History

The first version, "Big Rabbit Book", is on the `daftari` branch of [finance-trackers-legacy](https://github.com/NathanKagoro/finance-trackers-legacy/tree/daftari). Daftari version 2 will move onto Kitabu's code, keeping the same way of working: one shop per owner, set up by hand, with the owner's Google Sheet as their copy.
