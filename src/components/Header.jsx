import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CATEGORY_LABELS, NAV } from '../data/catalog';
import { useStore } from '../store/StoreContext';
import { EVENTS, track } from '../lib/analytics';
import { api } from '../mock/api';
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from './Icons';

export default function Header() {
  const { user, totals, wishlist, logout } = useStore();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const { total } = await api.search(q);
    track(EVENTS.SEARCH_SUBMITTED, { query: q, results_count: total, has_results: total > 0 });
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <div className="topstrip">
        <div className="shell topstrip-inner">
          <span>
            Free shipping over <strong>₹2,499</strong>
          </span>
          <span>
            Use code <strong>AMPIO10</strong> for 10% off
          </span>
          <span>30-day easy returns</span>
        </div>
      </div>

      <header className="site-header">
        <div className="shell header-row">
          <Link to="/" className="logo" aria-label="AMPIO home">
            AMPIO<i className="dot" />
          </Link>

          <nav className="nav">
            {NAV.map((entry) => (
              <div className="nav-item" key={entry.slug}>
                <NavLink
                  to={`/c/${entry.slug}`}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  {entry.label}
                </NavLink>
                <div className="nav-panel">
                  {entry.groups.map((group) => (
                    <div className="nav-group" key={group.label}>
                      <h4>{group.label}</h4>
                      {group.categories.map((cat) => (
                        <Link key={cat} to={`/c/${entry.slug}/${cat}`}>
                          {CATEGORY_LABELS[cat] || cat}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="nav-item">
              <NavLink to="/c/sale" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Sale
              </NavLink>
            </div>
          </nav>

          <div className="header-tools">
            <form className="search" onSubmit={onSearch} role="search">
              <SearchIcon width="16" height="16" />
              <input
                type="search"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for kurtas, sneakers, jeans…"
                aria-label="Search products"
              />
            </form>

            <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
              <HeartIcon />
              {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
              Saved
            </Link>

            <Link to="/cart" className="icon-btn" aria-label="Shopping bag">
              <BagIcon />
              {totals.itemCount > 0 && <span className="badge">{totals.itemCount}</span>}
              Bag
            </Link>

            <div className="account-menu" ref={menuRef}>
              <button type="button" className="icon-btn" onClick={() => setMenuOpen((o) => !o)}>
                <UserIcon />
                {user ? user.name.split(' ')[0] : 'Account'}
              </button>
              {menuOpen && (
                <div className="account-pop">
                  {user ? (
                    <>
                      <div className="who">
                        <strong>{user.name}</strong>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {user.email}
                        </div>
                        <div className="eyebrow" style={{ marginTop: 6 }}>
                          {user.loyaltyTier} member · {user.ordersCount} orders
                        </div>
                      </div>
                      <Link to="/orders" onClick={() => setMenuOpen(false)}>
                        My orders
                      </Link>
                      <Link to="/wishlist" onClick={() => setMenuOpen(false)}>
                        Wishlist
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          setMenuOpen(false);
                          await logout();
                          navigate('/');
                        }}
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="who">
                        <strong>Welcome to AMPIO</strong>
                        <div className="muted" style={{ fontSize: 13 }}>
                          Log in to sync your bag and orders.
                        </div>
                      </div>
                      <Link to="/login" onClick={() => setMenuOpen(false)}>
                        Log in
                      </Link>
                      <Link to="/login?mode=signup" onClick={() => setMenuOpen(false)}>
                        Create an account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
