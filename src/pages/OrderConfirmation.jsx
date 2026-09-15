import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductArt from '../art/ProductArt';
import { productById } from '../data/catalog';
import { api } from '../mock/api';
import { useStore } from '../store/StoreContext';
import { inr, shortDate } from '../lib/format';
import { CheckIcon } from '../components/Icons';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { token } = useStore();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getOrder(token, id)
      .then(setOrder)
      .catch((err) => setError(err.message));
  }, [id, token]);

  if (error) {
    return (
      <div className="shell" style={{ paddingBlock: '60px' }}>
        <div className="empty">
          <h2>{error}</h2>
          <Link className="btn btn-primary" to="/orders">
            View your orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="shell" style={{ paddingBlock: '60px' }}>
        <div className="skeleton" style={{ height: 240, borderRadius: 10 }} />
      </div>
    );
  }

  return (
    <div className="shell confirm">
      <div className="tick">
        <CheckIcon width="30" height="30" />
      </div>
      <h1>Order placed</h1>
      <p className="muted">
        Thanks{order.address.fullName ? `, ${order.address.fullName.split(' ')[0]}` : ''} — we have emailed the
        invoice and will text you when it ships.
      </p>

      <div className="order-card">
        <div className="kv">
          <div>
            <span>Order ID</span>
            <b>{order.id}</b>
          </div>
          <div>
            <span>Placed on</span>
            <b>{shortDate(order.placedAt)}</b>
          </div>
          <div>
            <span>Status</span>
            <b>{order.status}</b>
          </div>
          <div>
            <span>Arriving by</span>
            <b>{shortDate(order.eta)}</b>
          </div>
        </div>

        {order.items.map((item, i) => {
          const swatch = productById(item.productId)?.colors.find((c) => c.name === item.color)?.hex || '#888';
          return (
            <div className="mini-line" key={`${item.productId}-${i}`}>
              <div className="thumb-box">
                <ProductArt type={item.art} color={swatch} alt="" />
              </div>
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

        <div style={{ marginTop: 16 }}>
          <div className="sum-row">
            <span>Items</span>
            <span>{inr(order.totals.subtotal)}</span>
          </div>
          {order.totals.couponDiscount > 0 && (
            <div className="sum-row">
              <span>Coupon {order.coupon}</span>
              <span className="good">− {inr(order.totals.couponDiscount)}</span>
            </div>
          )}
          <div className="sum-row">
            <span>Shipping</span>
            <span>{order.totals.shipping === 0 ? 'Free' : inr(order.totals.shipping)}</span>
          </div>
          <div className="sum-row">
            <span>GST</span>
            <span>{inr(order.totals.tax)}</span>
          </div>
          <div className="sum-row total">
            <span>Paid</span>
            <span>{inr(order.totals.total)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 26 }}>
        <Link className="btn btn-primary" to="/orders">
          My orders
        </Link>
        <Link className="btn btn-outline" to="/">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
