import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductArt from '../art/ProductArt';
import { productById } from '../data/catalog';
import { api } from '../mock/api';
import { useStore } from '../store/StoreContext';
import { inr, shortDate } from '../lib/format';

export default function Orders() {
  const { token, user } = useStore();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.getOrders(token).then(setOrders);
  }, [token]);

  if (!orders) {
    return (
      <div className="shell" style={{ paddingBlock: '40px' }}>
        <div className="skeleton" style={{ height: 160, borderRadius: 10 }} />
      </div>
    );
  }

  return (
    <div className="shell" style={{ paddingBlock: '28px 70px', maxWidth: 900 }}>
      <div className="listing-toolbar">
        <div>
          <h1>My orders</h1>
          <div className="muted" style={{ fontSize: 13 }}>
            {user ? `${user.name} · ${user.loyaltyTier} member` : 'Guest orders from this browser'}
          </div>
        </div>
        <Link className="btn-link" to="/c/women">
          Continue shopping
        </Link>
      </div>

      {orders.length === 0 && (
        <div className="empty">
          <h2>No orders yet</h2>
          <p>Once you place an order it shows up here with its status and items.</p>
          <Link className="btn btn-primary" to="/">
            Start shopping
          </Link>
        </div>
      )}

      {orders.map((order) => (
        <div className="order-block" key={order.id}>
          <div className="order-head">
            <div>
              <div className="eyebrow">Order {order.id}</div>
              <strong>{inr(order.totals.total)}</strong>
              <span className="muted"> · {shortDate(order.placedAt)}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="status-tag">{order.status}</span>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Arriving by {shortDate(order.eta)}
              </div>
            </div>
          </div>

          {order.items.map((item, i) => {
            const swatch = productById(item.productId)?.colors.find((c) => c.name === item.color)?.hex || '#888';
            return (
              <div className="mini-line" key={`${item.productId}-${i}`}>
                <Link className="thumb-box" to={`/product/${item.productId}`}>
                  <ProductArt type={item.art} color={swatch} alt="" />
                </Link>
                <div>
                  <strong>{item.name}</strong>
                  <div className="muted">
                    {item.brand} · {item.size} · {item.color} · Qty {item.quantity}
                  </div>
                </div>
                <div>{inr(item.price * item.quantity)}</div>
              </div>
            );
          })}

          <div className="muted" style={{ fontSize: 13, paddingTop: 12 }}>
            Shipping to {order.address.line1}, {order.address.city} {order.address.pincode} ·{' '}
            {order.paymentMethod === 'cod' ? 'Cash on delivery' : `Paid via ${order.paymentMethod}`}
          </div>
        </div>
      ))}
    </div>
  );
}
