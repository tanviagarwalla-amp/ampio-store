import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Toasts from './components/Toasts';
import AnalyticsPanel from './components/AnalyticsPanel';
import Home from './pages/Home';
import Listing from './pages/Listing';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import ArtSheet from './pages/ArtSheet';
import { EVENTS, track } from './lib/analytics';
import { Link } from 'react-router-dom';

/** Names each route for the Page Viewed event so funnels read cleanly. */
function pageName(pathname) {
  if (pathname === '/') return 'Home';
  if (pathname.startsWith('/c/')) return 'Category Listing';
  if (pathname.startsWith('/product/')) return 'Product Detail';
  if (pathname.startsWith('/search')) return 'Search Results';
  if (pathname === '/cart') return 'Bag';
  if (pathname === '/checkout') return 'Checkout';
  if (pathname.startsWith('/order/')) return 'Order Confirmation';
  if (pathname === '/orders') return 'Order History';
  if (pathname === '/wishlist') return 'Wishlist';
  if (pathname === '/login') return 'Login';
  if (pathname === '/art') return 'Illustration Sheet';
  return 'Not Found';
}

function RouteTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    track(EVENTS.PAGE_VIEWED, {
      page_name: pageName(pathname),
      path: pathname,
      query_string: search || undefined,
      referrer_path: window.__ampioPrevPath || undefined,
    });
    window.__ampioPrevPath = pathname;
  }, [pathname, search]);

  return null;
}

function NotFound() {
  return (
    <div className="shell" style={{ paddingBlock: '70px' }}>
      <div className="empty">
        <h2>That page slipped out of stock</h2>
        <p>The link may be old or mistyped.</p>
        <Link className="btn btn-primary" to="/">
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <RouteTracker />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/c/:gender" element={<Listing />} />
          <Route path="/c/:gender/:category" element={<Listing />} />
          <Route path="/search" element={<Listing mode="search" />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirmation />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/login" element={<Login />} />
          {/* Unlinked QA page for the illustration set */}
          <Route path="/art" element={<ArtSheet />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toasts />
      <AnalyticsPanel />
    </>
  );
}
