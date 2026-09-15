# Aroma Good

Marketing and storefront site for Aroma Good cold-air scent diffusion.

Static HTML — no build step, no dependencies.

## Pages

- `index.html` — landing page: finishes, units, coverage calculator, scent library, plan information form
- `landing.html` — campaign page for the free Column scent subscription
- `product.html` — product configurator (unit, finish, starter scent, quantity)
- `cart.html` — full cart with quantity controls, removal, and monthly/one-time totals
- `checkout.html` — multi-item checkout preview (payments are not connected)

## Information pages

- `about.html` — brand and approach
- `collections.html` — diffusers, finishes, and scent collection; each scent links to the configurator
- `faq.html` — product, subscription, shipping, and return questions
- `contact.html` — support email and product/order/business inquiry links
- `shipping.html`, `returns.html` — current shipping estimates and product return/warranty conditions
- `privacy.html`, `terms.html` — notices covering the current preview and proposed offer
- `assets/site-pages.css` — shared responsive styling for these eight pages

### Policy details to complete

The policy content uses the existing site offer and `hello@aroma7.com`. Legal seller name, mailing and return addresses, refill schedule, minimum commitment, cancellation/diffuser-retention conditions, provider inventory, and data-retention schedule have not been supplied. The pages explicitly identify these gaps and the preview checkout status. They do not establish live subscription terms.

Shipping-delay content was informed by the [FTC merchandise-order guide](https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule). Subscription disclosures were informed by the [FTC consumer subscription guidance](https://consumer.ftc.gov/articles/getting-and-out-free-trials-auto-renewals-and-negative-option-subscriptions). This is site content for review, not a certification of legal compliance.

## Current offer

- Column: free diffuser with a **$29.99/month** scent subscription, reduced from **$39.99/month**. Includes a 200 ml starter scent.
- Spare cartridge: **$59** one-time add-on, excluded from the monthly renewal amount.
- Refill delivery frequency and minimum commitment/cancellation terms remain to be defined; monthly billing does not imply monthly shipping.
- Checkout is in demo mode. It does not charge, create orders, or enroll subscriptions. Connect a payment backend and finalize subscription terms before enabling purchases.
- Information forms need `FORM_ENDPOINT` configured in `index.html` and `landing.html` to receive submissions.

Pricing appears in all four HTML pages, including product data, checkout data, and structured metadata. Keep these in sync when changing an offer.

## Run locally

```sh
python3 -m http.server 8080
```

Then open http://127.0.0.1:8080/

## Assets

- `assets/aroma7-*.jpg` — the three diffuser finishes (steel, charcoal, cream)
- `assets/scent-*.jpg` — the five oil blends (First Light, Liquid Sun, Santal, The Unwinding, White Tea)
- `assets/banner-*.jpg` — brand banners
- `assets/logo-aroma-good.png` — horizontal logo lockup; `logo-mark.png` — AG roundel / favicon

## Cart

`assets/cart-store.js` is the shared cart model and runtime cart price source (USD cents). `assets/cart-ui.js` renders the cart drawer and full cart page; `assets/cart.css` styles them. Every page includes the cart trigger. Product buttons add the selected variant and optionally one separate spare cartridge.

The browser stores versioned selections in `aroma-good-cart-v1` (local storage). Prices are recalculated from the catalog, never trusted from storage or a URL. Identical variants merge; each variant supports quantities 1–10. Storage events synchronize tabs. When storage is blocked, checkout carries an encoded item snapshot in its URL. This is a client-side preview; a live backend must validate catalog prices and subscription terms independently.

The cart is retained after a demo checkout. Privacy documentation describes the new storage. Run cart model tests with `node --test tests/cart-store.test.cjs`.

For browser checks, serve the project and open `tests/cart-browser.html` in Chrome. It exercises the drawer, full cart, and checkout inside a 390px iframe and restores the previous cart when finished. Use an isolated browser profile for automated runs.
