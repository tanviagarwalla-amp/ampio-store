import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productById } from '../data/catalog';
import { useStore } from '../store/StoreContext';
import { EVENTS, track } from '../lib/analytics';

export default function Wishlist() {
  const { wishlist } = useStore();
  const items = wishlist.map(productById).filter(Boolean);

  useEffect(() => {
    track(EVENTS.PRODUCT_LIST_VIEWED, {
      list_name: 'Wishlist',
      item_count: items.length,
      placement: 'wishlist',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <div className="shell" style={{ paddingBlock: '28px 70px' }}>
      <div className="listing-toolbar">
        <div>
          <h1>Wishlist</h1>
          <div className="muted" style={{ fontSize: 13 }}>
            {items.length} saved item{items.length === 1 ? '' : 's'}
          </div>
        </div>
        <Link className="btn-link" to="/c/women">
          Continue shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <h2>Nothing saved yet</h2>
          <p>Tap the heart on any product to keep it here for later.</p>
          <Link className="btn btn-primary" to="/c/women">
            Browse the edit
          </Link>
        </div>
      ) : (
        <div className="grid">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} position={i + 1} listName="Wishlist" />
          ))}
        </div>
      )}
    </div>
  );
}
