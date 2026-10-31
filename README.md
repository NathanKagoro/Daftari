# Daftari

A sales book for very small shops: one owner, one phone, a short list of products. Swahili and English, light or dark, works offline and installs on the phone like an app.

**Demo:** https://nathankagoro.github.io/Daftari/demo/ (a sample shop, Duka la Mama Asha; data stays in your browser).

## Where the code is

Daftari is an **edition of Kitabu's code** ([NathanKagoro/Kitabu](https://github.com/NathanKagoro/Kitabu)): the same app built with `NEXT_PUBLIC_EDITION=daftari`. Both apps work out profit, stock, money owed and the cash in the tin with the same code, so a number means the same thing in each. This repo holds the build that publishes Daftari to GitHub Pages (`.github/workflows/pages.yml`); it rebuilds on every push here, nightly, and on demand.

What the Daftari edition changes (see `lib/edition` in Kitabu):

| | Daftari | Kitabu |
|---|---|---|
| Opens on | **Leo**: the profit for the period and one "Andika mauzo" button | The till |
| Tabs | Leo, Mauzo, Manunuzi, Wateja, Zaidi | Mauzo, Manunuzi, Madeni, Hesabu, Zaidi |
| Own features | Where the profit goes (tithe, reinvest, personal, savings), regulars due or late | Stock checks with shortfall in shillings, staff, invoices, TRA receipts |
| Left out | Staff, invoices, suppliers, VAT, TRA receipts, product codes, daily prices | — |
| Colour | Notebook blue | Green |

## How a shop gets Daftari

The same way as Kitabu: you create the shop in the admin screen, choosing **Daftari** as the product, and send the owner their setup code. One shop per owner. Each shop shows in the console with its product.

## Version 1

The first Daftari (one HTML page and a Google Sheet per shop) is on the [`v1`](../../tree/v1) branch, and still live at https://daftari-book.netlify.app for shops that use it. The very first version, "Big Rabbit Book", is on the `daftari` branch of [finance-trackers-legacy](https://github.com/NathanKagoro/finance-trackers-legacy/tree/daftari).

## Setup

1. **Settings → Pages → Source: GitHub Actions.**
2. Optional repository variables (Settings → Secrets and variables → Actions → Variables): `SUPABASE_URL`, `SUPABASE_ANON_KEY` (the same project as Kitabu), `SUPPORT_WHATSAPP`, `KITABU_REF`. Without Supabase it runs as a demo with data on the phone.
