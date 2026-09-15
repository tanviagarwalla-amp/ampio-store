/**
 * Amplitude instrumentation for the AMPIO storefront.
 *
 * Everything the UI tracks goes through this module so the tracking plan lives
 * in one place. The API key comes from either:
 *   1. VITE_AMPLITUDE_API_KEY (build-time env, see .env.example), or
 *   2. localStorage key set at runtime via the in-app "Amplitude" panel.
 *
 * With no key configured the app still runs: every event is recorded in the
 * local event log (visible in the in-app inspector) but nothing is sent.
 */

import * as amplitude from '@amplitude/analytics-browser';

const KEY_STORAGE = 'ampio.amplitudeApiKey';
const REPLAY_STORAGE = 'ampio.sessionReplay';
const APP_VERSION = '1.0.0';

let initialized = false;
let activeKey = null;
let replayEnabled = false;

/* ------------------------------------------------------------- event log */

const log = [];
const listeners = new Set();
const MAX_LOG = 60;

function record(type, name, payload) {
  const entry = { id: `${Date.now()}-${log.length}`, at: new Date(), type, name, payload, sent: initialized };
  log.unshift(entry);
  if (log.length > MAX_LOG) log.length = MAX_LOG;
  listeners.forEach((fn) => fn(getLog()));
}

export function getLog() {
  return log.slice();
}

export function subscribeToLog(fn) {
  listeners.add(fn);
  fn(getLog());
  return () => listeners.delete(fn);
}

export function clearLog() {
  log.length = 0;
  listeners.forEach((fn) => fn(getLog()));
}

/* ------------------------------------------------------------- key handling */

export function storedApiKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function configuredApiKey() {
  return import.meta.env.VITE_AMPLITUDE_API_KEY || storedApiKey() || '';
}

export function analyticsStatus() {
  return {
    initialized,
    apiKey: activeKey ? `${activeKey.slice(0, 6)}…${activeKey.slice(-4)}` : null,
    keySource: import.meta.env.VITE_AMPLITUDE_API_KEY ? 'env' : storedApiKey() ? 'browser' : 'none',
    sessionReplay: replayEnabled,
  };
}

export function saveApiKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* storage unavailable — key just won't persist */
  }
}

export function replayPreference() {
  try {
    return localStorage.getItem(REPLAY_STORAGE) !== 'off';
  } catch {
    return true;
  }
}

export function saveReplayPreference(on) {
  try {
    localStorage.setItem(REPLAY_STORAGE, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------- init */

export async function initAnalytics() {
  const key = configuredApiKey();
  if (!key) {
    record('system', 'Amplitude not configured — events are logged locally only', {});
    return false;
  }
  if (initialized) return true;

  if (replayPreference()) {
    try {
      const { sessionReplayPlugin } = await import('@amplitude/plugin-session-replay-browser');
      amplitude.add(sessionReplayPlugin({ sampleRate: 1 }));
      replayEnabled = true;
    } catch (err) {
      record('system', 'Session Replay plugin failed to load', { error: String(err) });
    }
  }

  amplitude.init(key, {
    autocapture: {
      attribution: true,
      fileDownloads: true,
      formInteractions: true,
      pageViews: true,
      sessions: true,
      elementInteractions: true,
      networkTracking: false,
      webVitals: true,
      frustrationInteractions: true,
    },
    // SPA: our router fires an explicit "Page Viewed" on every route change.
    defaultTracking: undefined,
  });

  initialized = true;
  activeKey = key;
  setUserProperties({ app_version: APP_VERSION, platform: 'web', storefront: 'ampio' });
  record('system', 'Amplitude initialised', analyticsStatus());
  return true;
}

/* ------------------------------------------------------------- core wrappers */

function scrub(props = {}) {
  const out = {};
  Object.entries(props).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    out[k] = v;
  });
  return out;
}

export function track(eventName, props = {}) {
  const payload = scrub(props);
  record('event', eventName, payload);
  if (initialized) amplitude.track(eventName, payload);
}

export function setUserProperties(props = {}) {
  const payload = scrub(props);
  record('identify', 'set', payload);
  if (!initialized) return;
  const identify = new amplitude.Identify();
  Object.entries(payload).forEach(([k, v]) => identify.set(k, v));
  amplitude.identify(identify);
}

export function setOnceUserProperties(props = {}) {
  const payload = scrub(props);
  record('identify', 'setOnce', payload);
  if (!initialized) return;
  const identify = new amplitude.Identify();
  Object.entries(payload).forEach(([k, v]) => identify.setOnce(k, v));
  amplitude.identify(identify);
}

export function incrementUserProperties(props = {}) {
  record('identify', 'add', props);
  if (!initialized) return;
  const identify = new amplitude.Identify();
  Object.entries(props).forEach(([k, v]) => identify.add(k, v));
  amplitude.identify(identify);
}

export function identifyUser(user) {
  if (!user) return;
  record('identify', 'setUserId', { user_id: user.id });
  if (initialized) amplitude.setUserId(user.id);
  setUserProperties({
    name: user.name,
    email_domain: (user.email || '').split('@')[1],
    city: user.city,
    loyalty_tier: user.loyaltyTier,
  });
  setOnceUserProperties({ signup_date: user.createdAt });
}

export function resetUser() {
  record('identify', 'reset', {});
  if (initialized) amplitude.reset();
}

export function trackRevenue({ orderId, items, coupon }) {
  items.forEach((item) => {
    record('revenue', item.name, { price: item.price, quantity: item.quantity, orderId });
    if (!initialized) return;
    const rev = new amplitude.Revenue()
      .setProductId(item.productId)
      .setPrice(item.price)
      .setQuantity(item.quantity)
      .setRevenueType('purchase')
      .setEventProperties({
        order_id: orderId,
        product_name: item.name,
        brand: item.brand,
        category: item.category,
        size: item.size,
        color: item.color,
        coupon_code: coupon || undefined,
      });
    amplitude.revenue(rev);
  });
}

/* ------------------------------------------------------------- tracking plan */

export const EVENTS = {
  PAGE_VIEWED: 'Page Viewed',
  PRODUCT_LIST_VIEWED: 'Product List Viewed',
  PRODUCT_CLICKED: 'Product Clicked',
  PRODUCT_VIEWED: 'Product Viewed',
  SIZE_SELECTED: 'Size Selected',
  COLOR_SELECTED: 'Color Selected',
  SIZE_GUIDE_OPENED: 'Size Guide Opened',
  ADD_TO_CART: 'Product Added to Cart',
  REMOVE_FROM_CART: 'Product Removed from Cart',
  CART_QTY_CHANGED: 'Cart Quantity Changed',
  CART_VIEWED: 'Cart Viewed',
  WISHLIST_ADDED: 'Wishlist Item Added',
  WISHLIST_REMOVED: 'Wishlist Item Removed',
  SEARCH_SUBMITTED: 'Search Submitted',
  FILTER_APPLIED: 'Filter Applied',
  FILTERS_CLEARED: 'Filters Cleared',
  SORT_APPLIED: 'Sort Applied',
  CHECKOUT_STARTED: 'Checkout Started',
  CHECKOUT_STEP_VIEWED: 'Checkout Step Viewed',
  CHECKOUT_STEP_COMPLETED: 'Checkout Step Completed',
  COUPON_APPLIED: 'Coupon Applied',
  COUPON_FAILED: 'Coupon Failed',
  PAYMENT_METHOD_SELECTED: 'Payment Method Selected',
  ORDER_COMPLETED: 'Order Completed',
  SIGN_UP_COMPLETED: 'Sign Up Completed',
  LOGIN_COMPLETED: 'Login Completed',
  LOGIN_FAILED: 'Login Failed',
  LOGOUT_COMPLETED: 'Logout Completed',
  NEWSLETTER_SUBSCRIBED: 'Newsletter Subscribed',
};

/** Standard product property block, reused across product events. */
export function productProps(product, extra = {}) {
  if (!product) return scrub(extra);
  return scrub({
    product_id: product.id,
    product_name: product.name,
    brand: product.brand,
    category: product.category,
    gender: product.gender,
    price: product.price,
    mrp: product.mrp,
    discount_percent: product.discount,
    rating: product.rating,
    ...extra,
  });
}
