import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_LABELS, NAV } from '../data/catalog';
import { useStore } from '../store/StoreContext';
import { EVENTS, track } from '../lib/analytics';

export default function Footer() {
  const { toast } = useStore();
  const [email, setEmail] = useState('');

  const subscribe = (e) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast('Enter a valid email address', 'error');
      return;
    }
    track(EVENTS.NEWSLETTER_SUBSCRIBED, { placement: 'footer', email_domain: email.split('@')[1] });
    toast('You are on the list', 'success');
    setEmail('');
  };

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <div className="logo" style={{ fontSize: 20, marginBottom: 10 }}>
            AMPIO<i className="dot" />
          </div>
          <p className="muted" style={{ fontSize: 13, maxWidth: '34ch', margin: 0 }}>
            A demo storefront built to exercise product analytics end to end — browse, vary, add to bag,
            check out, and watch the events land.
          </p>
          <form className="newsletter" onSubmit={subscribe}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              aria-label="Email address"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Join
            </button>
          </form>
        </div>

        {NAV.slice(0, 2).map((entry) => (
          <div key={entry.slug}>
            <h4>{entry.label}</h4>
            <ul>
              {entry.groups.flatMap((g) => g.categories).map((cat) => (
                <li key={cat}>
                  <Link to={`/c/${entry.slug}/${cat}`}>{CATEGORY_LABELS[cat] || cat}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4>Help</h4>
          <ul>
            <li>
              <Link to="/orders">Track your order</Link>
            </li>
            <li>
              <Link to="/cart">Your bag</Link>
            </li>
            <li>
              <Link to="/login">Log in / Sign up</Link>
            </li>
            <li>Returns & exchanges</li>
            <li>Size guide</li>
            <li>Contact us</li>
          </ul>
        </div>
      </div>

      <div className="shell footer-base">
        <span>© {new Date().getFullYear()} AMPIO — fictional storefront for analytics demos.</span>
        <span>Mock data only · No real payments are processed</span>
      </div>
    </footer>
  );
}
