/**
 * Single source of truth for session, bag, wishlist and toasts.
 *
 * Every mutation goes through the mock API and then emits the matching
 * Amplitude event, so instrumentation can't drift from what actually happened.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, cartTotals } from '../mock/api';
import { productById } from '../data/catalog';
import {
  EVENTS,
  identifyUser,
  incrementUserProperties,
  productProps,
  resetUser,
  setUserProperties,
  track,
  trackRevenue,
} from '../lib/analytics';

const TOKEN_KEY = 'ampio.token';
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  });
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [booting, setBooting] = useState(true);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const toast = useCallback((message, tone = 'info') => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const persistToken = useCallback((next) => {
    setToken(next);
    try {
      if (next) localStorage.setItem(TOKEN_KEY, next);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  /* --------------------------------------------------------- boot / restore */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, bag, wish] = await Promise.all([
          token ? api.me(token) : Promise.resolve(null),
          api.getCart(token),
          api.getWishlist(token),
        ]);
        if (cancelled) return;
        if (me) {
          setUser(me);
          identifyUser(me);
          setUserProperties({ lifetime_orders: me.ordersCount, lifetime_value: me.lifetimeValue });
        } else if (token) {
          persistToken('');
        }
        setCart(bag);
        setWishlist(wish);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // token intentionally read once at boot; auth actions update state directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => cartTotals(cart, coupon?.code), [cart, coupon]);

  /* --------------------------------------------------------- auth */
  const login = useCallback(
    async (credentials) => {
      try {
        const { token: next, user: nextUser, mergedItems } = await api.login(credentials);
        persistToken(next);
        setUser(nextUser);
        identifyUser(nextUser);
        setUserProperties({
          lifetime_orders: nextUser.ordersCount,
          lifetime_value: nextUser.lifetimeValue,
        });
        track(EVENTS.LOGIN_COMPLETED, {
          method: 'email',
          merged_guest_items: mergedItems,
          is_returning: nextUser.ordersCount > 0,
        });
        const [bag, wish] = await Promise.all([api.getCart(next), api.getWishlist(next)]);
        setCart(bag);
        setWishlist(wish);
        toast(`Welcome back, ${nextUser.name.split(' ')[0]}`, 'success');
        return nextUser;
      } catch (err) {
        track(EVENTS.LOGIN_FAILED, { method: 'email', reason: err.message });
        throw err;
      }
    },
    [persistToken, toast],
  );

  const signup = useCallback(
    async (form) => {
      const { token: next, user: nextUser, mergedItems } = await api.signup(form);
      persistToken(next);
      setUser(nextUser);
      identifyUser(nextUser);
      track(EVENTS.SIGN_UP_COMPLETED, { method: 'email', merged_guest_items: mergedItems });
      const [bag, wish] = await Promise.all([api.getCart(next), api.getWishlist(next)]);
      setCart(bag);
      setWishlist(wish);
      toast(`Account created — welcome, ${nextUser.name.split(' ')[0]}`, 'success');
      return nextUser;
    },
    [persistToken, toast],
  );

  const logout = useCallback(async () => {
    const itemsInBag = totals.itemCount;
    await api.logout(token);
    track(EVENTS.LOGOUT_COMPLETED, { items_in_bag: itemsInBag });
    resetUser();
    persistToken('');
    setUser(null);
    setCoupon(null);
    const [bag, wish] = await Promise.all([api.getCart(''), api.getWishlist('')]);
    setCart(bag);
    setWishlist(wish);
    toast('You have been logged out', 'info');
  }, [persistToken, toast, token, totals.itemCount]);

  /* --------------------------------------------------------- bag */
  const addToCart = useCallback(
    async ({ productId, size, color, quantity = 1, source = 'pdp' }) => {
      const product = productById(productId);
      const next = await api.addToCart(token, { productId, size, color, quantity });
      setCart(next);
      const nextTotals = cartTotals(next, coupon?.code);
      track(EVENTS.ADD_TO_CART, {
        ...productProps(product, { size, color, quantity }),
        source,
        line_value: (product?.price || 0) * quantity,
        cart_size: nextTotals.itemCount,
        cart_value: nextTotals.subtotal,
        is_logged_in: Boolean(user),
      });
      incrementUserProperties({ add_to_cart_count: 1 });
      toast(`${product?.name} added to bag`, 'success');
      return next;
    },
    [coupon, toast, token, user],
  );

  const updateQuantity = useCallback(
    async (line, quantity) => {
      const previous = line.quantity;
      const next = await api.updateCartItem(token, line.lineId, quantity);
      setCart(next);
      track(EVENTS.CART_QTY_CHANGED, {
        ...productProps(productById(line.productId), { size: line.size, color: line.color }),
        previous_quantity: previous,
        new_quantity: quantity,
        direction: quantity > previous ? 'increase' : 'decrease',
        cart_value: cartTotals(next, coupon?.code).subtotal,
      });
      return next;
    },
    [coupon, token],
  );

  const removeFromCart = useCallback(
    async (line) => {
      const next = await api.removeCartItem(token, line.lineId);
      setCart(next);
      const nextTotals = cartTotals(next, coupon?.code);
      track(EVENTS.REMOVE_FROM_CART, {
        ...productProps(productById(line.productId), {
          size: line.size,
          color: line.color,
          quantity: line.quantity,
        }),
        cart_size: nextTotals.itemCount,
        cart_value: nextTotals.subtotal,
      });
      toast(`${line.name} removed from bag`, 'info');
      return next;
    },
    [coupon, toast, token],
  );

  const toggleWishlist = useCallback(
    async (product, source = 'card') => {
      const { wishlist: next, added } = await api.toggleWishlist(token, product.id);
      setWishlist(next);
      track(added ? EVENTS.WISHLIST_ADDED : EVENTS.WISHLIST_REMOVED, {
        ...productProps(product),
        source,
        wishlist_size: next.length,
      });
      toast(added ? `${product.name} saved to wishlist` : `${product.name} removed from wishlist`, 'info');
      return added;
    },
    [toast, token],
  );

  const applyCoupon = useCallback(
    async (code) => {
      try {
        const def = await api.applyCoupon(code, totals.subtotal);
        setCoupon(def);
        const applied = cartTotals(cart, def.code);
        track(EVENTS.COUPON_APPLIED, {
          coupon_code: def.code,
          coupon_type: def.type,
          discount_value: applied.couponDiscount,
          cart_value: totals.subtotal,
        });
        toast(`${def.code} applied — ${def.label}`, 'success');
        return def;
      } catch (err) {
        track(EVENTS.COUPON_FAILED, { coupon_code: code, reason: err.message, cart_value: totals.subtotal });
        throw err;
      }
    },
    [cart, toast, totals.subtotal],
  );

  const clearCoupon = useCallback(() => setCoupon(null), []);

  const placeOrder = useCallback(
    async ({ address, paymentMethod }) => {
      const { order, user: nextUser } = await api.placeOrder(token, {
        address,
        paymentMethod,
        coupon: coupon?.code,
      });
      setCart([]);
      setCoupon(null);
      if (nextUser) {
        setUser(nextUser);
        setUserProperties({
          lifetime_orders: nextUser.ordersCount,
          lifetime_value: nextUser.lifetimeValue,
          loyalty_tier: nextUser.loyaltyTier,
          city: nextUser.city,
        });
      }
      track(EVENTS.ORDER_COMPLETED, {
        order_id: order.id,
        revenue: order.totals.total,
        subtotal: order.totals.subtotal,
        tax: order.totals.tax,
        shipping: order.totals.shipping,
        coupon_code: order.coupon || undefined,
        coupon_discount: order.totals.couponDiscount,
        bag_discount: order.totals.bagDiscount,
        payment_method: paymentMethod,
        item_count: order.totals.itemCount,
        unique_products: order.items.length,
        categories: [...new Set(order.items.map((i) => i.category))],
        brands: [...new Set(order.items.map((i) => i.brand))],
        products: order.items.map((i) => `${i.name} (${i.size}/${i.color}) x${i.quantity}`),
        is_first_order: (nextUser?.ordersCount ?? 1) === 1,
        city: address.city,
      });
      trackRevenue({ orderId: order.id, items: order.items, coupon: order.coupon });
      incrementUserProperties({ orders_placed: 1, revenue_total: order.totals.total });
      return order;
    },
    [coupon, token],
  );

  const value = useMemo(
    () => ({
      token,
      user,
      booting,
      cart,
      totals,
      coupon,
      wishlist,
      toasts,
      toast,
      dismissToast,
      login,
      signup,
      logout,
      addToCart,
      updateQuantity,
      removeFromCart,
      toggleWishlist,
      applyCoupon,
      clearCoupon,
      placeOrder,
    }),
    [
      addToCart,
      applyCoupon,
      booting,
      cart,
      clearCoupon,
      coupon,
      dismissToast,
      login,
      logout,
      placeOrder,
      removeFromCart,
      signup,
      toast,
      toasts,
      toggleWishlist,
      token,
      totals,
      updateQuantity,
      user,
      wishlist,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
