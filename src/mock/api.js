/**
 * Mock backend.
 *
 * A tiny "server" that lives in localStorage: users, sessions, carts, wishlists
 * and orders all persist across reloads, requests have realistic latency, and
 * failures come back as real rejected promises so the UI has to handle them.
 *
 * Nothing here is production auth — passwords are hashed with a toy hash purely
 * so the demo never stores a readable password. Do not reuse this for anything.
 */

import { PRODUCTS, COUPONS, productById } from '../data/catalog';

const NS = 'ampio.db.v1';
const GUEST = 'guest';
const SHIPPING_FEE = 99;
const FREE_SHIPPING_ABOVE = 2499;
const TAX_RATE = 0.05;

/* ------------------------------------------------------------------ storage */

const emptyDb = () => ({ users: [], sessions: {}, carts: {}, wishlists: {}, orders: [] });

function read() {
  try {
    const raw = localStorage.getItem(NS);
    if (!raw) return seed(emptyDb());
    return { ...emptyDb(), ...JSON.parse(raw) };
  } catch {
    return emptyDb();
  }
}

function write(db) {
  try {
    localStorage.setItem(NS, JSON.stringify(db));
  } catch {
    /* quota or private mode — the session just won't persist */
  }
  return db;
}

function seed(db) {
  db.users.push({
    id: 'usr_demo',
    name: 'Demo Shopper',
    email: 'demo@ampio.test',
    password: hash('ampio1234'),
    city: 'Bengaluru',
    loyaltyTier: 'Silver',
    createdAt: new Date('2026-01-12').toISOString(),
    ordersCount: 2,
    lifetimeValue: 5398,
  });
  return write(db);
}

/** Toy, non-cryptographic hash. Mock data only. */
function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return `mock$${h.toString(16)}`;
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function latency(min = 160, max = 420) {
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
}

class ApiError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ApiError';
    this.field = field;
  }
}

async function call(fn, { min, max } = {}) {
  await latency(min, max);
  const db = read();
  const result = fn(db);
  write(db);
  return result;
}

/* ------------------------------------------------------------------ helpers */

function ownerFor(db, token) {
  if (!token) return GUEST;
  const userId = db.sessions[token];
  return userId || GUEST;
}

function userFromToken(db, token) {
  const userId = db.sessions[token];
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) || null;
}

function publicUser(user) {
  if (!user) return null;
  const { password: _password, ...rest } = user;
  return rest;
}

/** Deterministic per-variant stock so "Only N left" is stable across reloads. */
export function variantStock(productId, size, color) {
  const product = productById(productId);
  if (!product) return 0;
  if (product.outOfStock.includes(size)) return 0;
  let h = 7;
  const key = `${productId}|${size}|${color}`;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) % 9973;
  return (h % 7) + 3; // 3..9 — low enough to show scarcity, high enough to shop
}

function cartLines(db, owner) {
  const lines = db.carts[owner] || [];
  return lines
    .map((line) => {
      const product = productById(line.productId);
      if (!product) return null;
      return {
        ...line,
        name: product.name,
        brand: product.brand,
        category: product.category,
        gender: product.gender,
        art: product.art,
        price: product.price,
        mrp: product.mrp,
        discount: product.discount,
        lineTotal: product.price * line.quantity,
      };
    })
    .filter(Boolean);
}

export function cartTotals(lines, coupon) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const mrpTotal = lines.reduce((sum, l) => sum + l.mrp * l.quantity, 0);
  let discount = 0;
  let shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;

  if (coupon) {
    const def = COUPONS[coupon];
    if (def?.type === 'percent') discount = Math.round((subtotal * def.value) / 100);
    if (def?.type === 'flat') discount = def.value;
    if (def?.type === 'shipping') shipping = 0;
  }
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * TAX_RATE);
  return {
    subtotal,
    mrpTotal,
    bagDiscount: mrpTotal - subtotal,
    couponDiscount: discount,
    shipping,
    tax,
    total: taxable + tax + shipping,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    freeShippingAbove: FREE_SHIPPING_ABOVE,
  };
}

/* ------------------------------------------------------------------ catalog */

function matchesFilters(product, filters = {}) {
  if (filters.gender && product.gender !== filters.gender) return false;
  if (filters.category && product.category !== filters.category) return false;
  if (filters.categories?.length && !filters.categories.includes(product.category)) return false;
  if (filters.brands?.length && !filters.brands.includes(product.brand)) return false;
  if (filters.colors?.length && !product.colors.some((c) => filters.colors.includes(c.name))) return false;
  if (filters.sizes?.length) {
    const available = product.sizes.filter((s) => !product.outOfStock.includes(s));
    if (!filters.sizes.some((s) => available.includes(s))) return false;
  }
  if (filters.maxPrice && product.price > filters.maxPrice) return false;
  if (filters.minDiscount && product.discount < filters.minDiscount) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const haystack = [product.name, product.brand, product.category, product.gender, ...product.tags]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

const SORTERS = {
  recommended: (a, b) => b.rating * b.reviews - a.rating * a.reviews,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  discount: (a, b) => b.discount - a.discount,
  rating: (a, b) => b.rating - a.rating,
  newest: (a, b) => Number(b.tags.includes('new')) - Number(a.tags.includes('new')),
};

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: "What's New" },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Discount' },
  { value: 'rating', label: 'Customer Rating' },
];

/* ------------------------------------------------------------------ api */

export const api = {
  /* ---- auth */
  async signup({ name, email, password }) {
    return call((db) => {
      if (!name?.trim()) throw new ApiError('Tell us your name', 'name');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '')) throw new ApiError('Enter a valid email address', 'email');
      if (!password || password.length < 8) throw new ApiError('Password needs at least 8 characters', 'password');
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new ApiError('An account with this email already exists', 'email');
      }
      const user = {
        id: uid('usr'),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hash(password),
        city: '',
        loyaltyTier: 'Bronze',
        createdAt: new Date().toISOString(),
        ordersCount: 0,
        lifetimeValue: 0,
      };
      db.users.push(user);
      const token = uid('tok');
      db.sessions[token] = user.id;
      // carry the guest bag over so a mid-session signup doesn't lose it
      const guestCart = db.carts[GUEST] || [];
      if (guestCart.length) {
        db.carts[user.id] = guestCart;
        db.carts[GUEST] = [];
      }
      return { token, user: publicUser(user), mergedItems: guestCart.length };
    });
  },

  async login({ email, password }) {
    return call((db) => {
      const user = db.users.find((u) => u.email.toLowerCase() === (email || '').trim().toLowerCase());
      if (!user || user.password !== hash(password || '')) {
        throw new ApiError('Email or password is incorrect');
      }
      const token = uid('tok');
      db.sessions[token] = user.id;
      const guestCart = db.carts[GUEST] || [];
      if (guestCart.length) {
        const existing = db.carts[user.id] || [];
        guestCart.forEach((line) => {
          const match = existing.find(
            (l) => l.productId === line.productId && l.size === line.size && l.color === line.color,
          );
          if (match) match.quantity += line.quantity;
          else existing.push(line);
        });
        db.carts[user.id] = existing;
        db.carts[GUEST] = [];
      }
      return { token, user: publicUser(user), mergedItems: guestCart.length };
    });
  },

  async logout(token) {
    return call((db) => {
      delete db.sessions[token];
      return { ok: true };
    }, { min: 80, max: 180 });
  },

  async me(token) {
    return call((db) => publicUser(userFromToken(db, token)), { min: 60, max: 140 });
  },

  /* ---- catalog */
  async listProducts({ filters = {}, sort = 'recommended' } = {}) {
    await latency(140, 340);
    const items = PRODUCTS.filter((p) => matchesFilters(p, filters)).sort(SORTERS[sort] || SORTERS.recommended);
    const pool = PRODUCTS.filter((p) => matchesFilters(p, { ...filters, brands: [], colors: [], sizes: [], maxPrice: 0, minDiscount: 0 }));
    return {
      items,
      total: items.length,
      facets: {
        brands: [...new Set(pool.map((p) => p.brand))].sort(),
        colors: [...new Set(pool.flatMap((p) => p.colors.map((c) => c.name)))].sort(),
        sizes: [...new Set(pool.flatMap((p) => p.sizes))],
        priceMax: Math.max(999, ...pool.map((p) => p.price)),
      },
    };
  },

  async getProduct(id) {
    await latency(120, 280);
    const product = productById(id);
    if (!product) throw new ApiError('That product is no longer available');
    const related = PRODUCTS.filter((p) => p.id !== id && (p.category === product.category || p.brand === product.brand)).slice(0, 4);
    return { product, related };
  },

  async search(q) {
    await latency(100, 220);
    if (!q?.trim()) return { items: [], total: 0 };
    const items = PRODUCTS.filter((p) => matchesFilters(p, { q: q.trim() }));
    return { items, total: items.length };
  },

  /* ---- cart */
  async getCart(token) {
    return call((db) => cartLines(db, ownerFor(db, token)), { min: 80, max: 200 });
  },

  async addToCart(token, { productId, size, color, quantity = 1 }) {
    return call((db) => {
      const product = productById(productId);
      if (!product) throw new ApiError('Product not found');
      if (product.sizes.length > 1 && !size) throw new ApiError('Please select a size', 'size');
      const chosenSize = size || product.sizes[0];
      if (product.outOfStock.includes(chosenSize)) throw new ApiError(`Size ${chosenSize} is sold out`, 'size');
      const stock = variantStock(productId, chosenSize, color);
      const owner = ownerFor(db, token);
      const lines = db.carts[owner] || [];
      const existing = lines.find((l) => l.productId === productId && l.size === chosenSize && l.color === color);
      const nextQty = (existing?.quantity || 0) + quantity;
      if (nextQty > stock) throw new ApiError(`Only ${stock} left in ${chosenSize} / ${color}`, 'quantity');
      if (existing) existing.quantity = nextQty;
      else lines.push({ lineId: uid('line'), productId, size: chosenSize, color, quantity });
      db.carts[owner] = lines;
      return cartLines(db, owner);
    });
  },

  async updateCartItem(token, lineId, quantity) {
    return call((db) => {
      const owner = ownerFor(db, token);
      const lines = db.carts[owner] || [];
      const line = lines.find((l) => l.lineId === lineId);
      if (!line) throw new ApiError('That bag item is gone');
      if (quantity < 1) throw new ApiError('Quantity must be at least 1', 'quantity');
      const stock = variantStock(line.productId, line.size, line.color);
      if (quantity > stock) throw new ApiError(`Only ${stock} left in ${line.size}`, 'quantity');
      line.quantity = quantity;
      db.carts[owner] = lines;
      return cartLines(db, owner);
    }, { min: 100, max: 240 });
  },

  async removeCartItem(token, lineId) {
    return call((db) => {
      const owner = ownerFor(db, token);
      db.carts[owner] = (db.carts[owner] || []).filter((l) => l.lineId !== lineId);
      return cartLines(db, owner);
    }, { min: 100, max: 240 });
  },

  async applyCoupon(code, subtotal) {
    await latency(200, 420);
    const def = COUPONS[(code || '').trim().toUpperCase()];
    if (!def) throw new ApiError(`"${code}" isn't a valid code`);
    if (def.minimum && subtotal < def.minimum) {
      throw new ApiError(`Spend ₹${def.minimum.toLocaleString('en-IN')} to use ${def.code}`);
    }
    return def;
  },

  /* ---- wishlist */
  async getWishlist(token) {
    return call((db) => db.wishlists[ownerFor(db, token)] || [], { min: 60, max: 140 });
  },

  async toggleWishlist(token, productId) {
    return call((db) => {
      const owner = ownerFor(db, token);
      const list = db.wishlists[owner] || [];
      const has = list.includes(productId);
      db.wishlists[owner] = has ? list.filter((id) => id !== productId) : [...list, productId];
      return { wishlist: db.wishlists[owner], added: !has };
    }, { min: 80, max: 180 });
  },

  /* ---- orders */
  async placeOrder(token, { address, paymentMethod, coupon }) {
    return call((db) => {
      const owner = ownerFor(db, token);
      const lines = cartLines(db, owner);
      if (!lines.length) throw new ApiError('Your bag is empty');
      ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'].forEach((f) => {
        if (!address?.[f]?.trim()) throw new ApiError('Please complete your delivery address', f);
      });
      if (!/^\d{10}$/.test(address.phone.replace(/\s/g, ''))) throw new ApiError('Enter a 10-digit phone number', 'phone');
      if (!/^\d{6}$/.test(address.pincode)) throw new ApiError('Enter a 6-digit PIN code', 'pincode');
      if (!paymentMethod) throw new ApiError('Choose a payment method', 'paymentMethod');

      const totals = cartTotals(lines, coupon);
      const order = {
        id: `AMP${Date.now().toString().slice(-8)}`,
        placedAt: new Date().toISOString(),
        items: lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          brand: l.brand,
          category: l.category,
          art: l.art,
          size: l.size,
          color: l.color,
          quantity: l.quantity,
          price: l.price,
        })),
        totals,
        address,
        paymentMethod,
        coupon: coupon || null,
        status: paymentMethod === 'cod' ? 'Confirmed — pay on delivery' : 'Paid',
        eta: new Date(Date.now() + 4 * 864e5).toISOString(),
        owner,
      };
      db.orders.unshift(order);
      db.carts[owner] = [];

      const user = userFromToken(db, token);
      if (user) {
        user.ordersCount = (user.ordersCount || 0) + 1;
        user.lifetimeValue = (user.lifetimeValue || 0) + totals.total;
        if (!user.city && address.city) user.city = address.city;
        if (user.lifetimeValue > 15000) user.loyaltyTier = 'Gold';
        else if (user.lifetimeValue > 5000) user.loyaltyTier = 'Silver';
      }
      return { order, user: publicUser(user) };
    }, { min: 500, max: 900 });
  },

  async getOrders(token) {
    return call((db) => {
      const owner = ownerFor(db, token);
      return db.orders.filter((o) => o.owner === owner);
    }, { min: 120, max: 260 });
  },

  async getOrder(token, orderId) {
    return call((db) => {
      const order = db.orders.find((o) => o.id === orderId);
      if (!order) throw new ApiError('Order not found');
      return order;
    }, { min: 100, max: 200 });
  },
};

export { ApiError, SHIPPING_FEE, FREE_SHIPPING_ABOVE };
