# AMPIO — mock fashion storefront for Amplitude

An Ajio-style fashion store with a **real front end and a mock back end**, built so you can point
Amplitude at it and get a full ecommerce event stream — browse → variant selection → bag → login →
checkout → purchase — without a server, a database, or a payment provider.

```bash
npm install
npm run dev     # http://localhost:5173
```

Demo login: **demo@ampio.test** / **ampio1234** (or create an account — it's stored in your browser).

---

## What's in it

| Area | Detail |
| --- | --- |
| Catalog | 36 products across Women / Men / Kids / Accessories, 19 categories, ₹ pricing with MRP + discount |
| Variants | Real size and colour variants per product, per-variant stock, sold-out sizes, "only N left" |
| Imagery | Every product image is a **drawn illustration of that product type**, recoloured live by the selected colourway — no random stock photos, no external requests (see below) |
| Auth | Sign up, log in, log out, session in `localStorage`, guest bag merges into your account on login |
| Bag | Add / remove, quantity with stock limits, move to wishlist, coupons, free-shipping threshold, GST |
| Checkout | 3 steps (address → payment → review), field validation, 4 payment methods, order confirmation, order history |
| Listing | Category rails, search, facet filters (category / brand / size / colour / price / discount), 6 sort orders, skeleton loading, empty states |
| Analytics | Amplitude Browser SDK 2 + Session Replay, ~28 typed events, user properties, revenue events, and an in-app event inspector |
| Responsive | Desktop, tablet and phone layouts (filter drawer, stacked header, 2-up grid) |

## Connecting Amplitude

Two options — no rebuild needed for the second:

1. **Build-time.** Copy `.env.example` to `.env` and set `VITE_AMPLITUDE_API_KEY`.
2. **Runtime.** Click the **Amplitude** pill at the bottom-right, paste a project API key, hit
   **Connect**. The key is kept in `localStorage` for that browser only.

Find the key in Amplitude under _Settings → Projects → \[your project\] → General → API Key_.

Until a key is set the app runs normally and every event still appears in the inspector — it just
isn't sent anywhere. That makes the inspector useful for reviewing the tracking plan before pointing
it at a real project.

The inspector also toggles **Session Replay** (on by default when a key is set).

### Tracking plan

Events are defined once in [`src/lib/analytics.js`](src/lib/analytics.js) and fired from the store
and pages, so instrumentation can't drift from behaviour.

| Event | Fired when | Key properties |
| --- | --- | --- |
| `Page Viewed` | every route change | `page_name`, `path`, `referrer_path` |
| `Product List Viewed` | a rail, listing, search or wishlist renders | `list_name`, `item_count`, `sort`, `active_filter_count` |
| `Product Clicked` | a card is opened | `product_id`, `position`, `list_name` |
| `Product Viewed` | a PDP loads | `price`, `mrp`, `discount_percent`, `available_sizes`, `rating` |
| `Size Selected` / `Color Selected` | variant pickers | `size` / `color`, `units_left`, `source` |
| `Size Guide Opened` | size guide link | product block |
| `Product Added to Cart` | add to bag / buy now | `size`, `color`, `quantity`, `cart_size`, `cart_value`, `source` |
| `Cart Quantity Changed` | ± stepper | `previous_quantity`, `new_quantity`, `direction` |
| `Product Removed from Cart` | remove | product block, `cart_value` |
| `Cart Viewed` | bag page | `item_count`, `has_coupon`, `is_logged_in` |
| `Wishlist Item Added` / `Removed` | heart toggle | `wishlist_size`, `source` |
| `Search Submitted` | header search | `query`, `results_count`, `has_results` |
| `Filter Applied` / `Filters Cleared` / `Sort Applied` | listing controls | `filter_type`, `filter_value`, `sort_by` |
| `Checkout Started` | proceed to checkout | `cart_value`, `total_payable`, `coupon_code` |
| `Checkout Step Viewed` / `Checkout Step Completed` | each of the 3 steps | `step_number`, `step_name` |
| `Coupon Applied` / `Coupon Failed` | coupon box | `coupon_code`, `discount_value`, `reason` |
| `Payment Method Selected` | payment step | `payment_method` |
| `Order Completed` | order placed | `order_id`, `revenue`, `tax`, `shipping`, `coupon_discount`, `payment_method`, `categories`, `is_first_order` |
| `Login Completed` / `Login Failed` / `Sign Up Completed` / `Logout Completed` | auth | `method`, `merged_guest_items`, `reason` |
| `Newsletter Subscribed` | footer form | `placement`, `email_domain` |
| `Delivery Checked` | PDP PIN code check | `pincode_prefix`, `eta_days` |

Plus, on top of the event stream:

- `identify` with **user properties** — `name`, `email_domain`, `city`, `loyalty_tier`,
  `lifetime_orders`, `lifetime_value`, `signup_date` (set once), and counters incremented with
  `add` (`add_to_cart_count`, `orders_placed`, `revenue_total`).
- **Revenue events** — one `amplitude.revenue()` per line item on purchase, with product id, price,
  quantity, and order/variant metadata.
- **Autocapture** — page views, sessions, clicks, form interactions, file downloads, attribution,
  web vitals and frustration interactions are on. Funnels can therefore mix your named events with
  `[Amplitude]` autocaptured ones.
- `amplitude.reset()` on logout, so a subsequent guest session isn't attributed to the old user.

Coupons to try: `AMPIO10` (10% off), `FLAT300` (₹300 off above ₹1,999), `FREESHIP`.

## Product imagery

Product images are generated, not fetched. [`src/art/ProductArt.jsx`](src/art/ProductArt.jsx) holds
21 renderers — t-shirt, polo, shirt, kurta, dress, saree, top, jeans, trousers, shorts, skirt,
jacket, hoodie, sweatshirt, sneakers, heels, flats, handbag, watch, sunglasses, cap — and each
product declares which one it uses:

```js
{ id: 'w-saree-kanjivaram', art: 'saree', colors: [{ name: 'Temple Red', hex: '#8e2231' }, …] }
```

The renderer draws that garment and derives its whole palette (highlight, shade, stitch line) from
the selected colourway, with `front`, `back` and zoomed `detail` views for the PDP gallery. So a
saree always looks like a saree, and picking "Peacock Blue" actually repaints it. Visit
[`/#/art`](http://localhost:5173/#/art) for a contact sheet of every renderer, view and colour —
handy when you add a new `art` type.

## Mock back end

[`src/mock/api.js`](src/mock/api.js) is a small fake server over `localStorage`: users, sessions,
carts, wishlists and orders persist across reloads, each call has 100–900 ms of latency, and invalid
input comes back as a rejected promise the UI has to handle (wrong password, sold-out size, quantity
over stock, bad PIN code, invalid coupon, empty bag).

Two deliberate non-features, because this is a demo:

- Passwords are run through a toy non-cryptographic hash purely so nothing readable is stored. It is
  not authentication — never enter a real password.
- **No payment is processed and no card, CVV or UPI PIN is ever collected.** Each payment option
  selects a pre-defined test instrument.

Reset all demo state by clearing the site's `localStorage` (keys under `ampio.`).

## Project layout

```
src/
  art/ProductArt.jsx     illustration renderers + colour maths
  data/catalog.js        products, categories, navigation, coupons
  mock/api.js            fake back end (auth, cart, orders, coupons, stock)
  lib/analytics.js       Amplitude init, tracking plan, event log
  store/StoreContext.jsx session + bag + wishlist state, fires the events
  components/            header, footer, product card, toasts, Amplitude inspector
  pages/                 home, listing, product, cart, checkout, orders, login, wishlist, art sheet
```

## Deploying

`npm run build` emits a static `dist/` with relative asset paths, and routing uses a hash router, so
it works on any static host with no rewrite rules.

**GitHub Pages** is wired up: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
builds and publishes on every push to `main`. Enable it once per repository:

1. Push the repo to GitHub.
2. _Settings → Pages → Build and deployment → Source_ → **GitHub Actions**.
3. Optional: _Settings → Secrets and variables → Actions_ → add `AMPLITUDE_API_KEY` to bake a key
   into the build. Skip it and paste the key at runtime instead.

The site then lives at `https://<org-or-user>.github.io/<repo>/`.

> Deployment target note: this repo ships GitHub Pages config rather than Vercel, because Vercel is
> not on the approved hosting list for this org (approved: Superblocks, Lovable, GitHub Pages). If
> Pages doesn't fit the use case, check with the IT team before using another host.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | dev server with HMR |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the production build locally |
