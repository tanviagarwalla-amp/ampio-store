import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductArt from '../art/ProductArt';
import { COUPONS, productById } from '../data/catalog';
import { variantStock } from '../mock/api';
import { useStore } from '../store/StoreContext';
import { EVENTS, track } from '../lib/analytics';
import { inr } from '../lib/format';

export default function Cart() {
  const navigate = useNavigate();
  const {
    cart,
    totals,
    coupon,
    user,
    updateQuantity,
    removeFromCart,
    toggleWishlist,
    applyCoupon,
    clearCoupon,
    toast,
  } = useStore();

  const [code, setCode] = useState('');
  const [busyLine, setBusyLine] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    track(EVENTS.CART_VIEWED, {
      item_count: totals.itemCount,
      unique_products: cart.length,
      cart_value: totals.subtotal,
      has_coupon: Boolean(coupon),
      is_logged_in: Boolean(user),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeQty = async (line, next) => {
    setBusyLine(line.lineId);
    try {
      await updateQuantity(line, next);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyLine('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="shell" style={{ paddingBlock: '48px 80px' }}>
        <div className="empty">
          <h2>Your bag is empty</h2>
          <p>Saved something for later? Your wishlist is still there.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link className="btn btn-primary" to="/c/women">
              Shop Women
            </Link>
            <Link className="btn btn-outline" to="/c/men">
              Shop Men
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const toFreeShipping = Math.max(0, totals.freeShippingAbove - totals.subtotal);
  const shipProgress = Math.min(100, (totals.subtotal / totals.freeShippingAbove) * 100);

  return (
    <div className="shell cart-wrap">
      <section>
        <div className="listing-toolbar" style={{ marginBottom: 0 }}>
          <div>
            <h1>Your bag</h1>
            <div className="muted" style={{ fontSize: 13 }}>
              {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'} · {cart.length} product
              {cart.length === 1 ? '' : 's'}
            </div>
          </div>
          <Link className="btn-link" to="/c/women">
            Continue shopping
          </Link>
        </div>

        {cart.map((line) => {
          const stock = variantStock(line.productId, line.size, line.color);
          const product = productById(line.productId);
          const swatch = product?.colors.find((c) => c.name === line.color)?.hex || '#888';
          return (
            <div className="cart-line" key={line.lineId}>
              <Link className="thumb-box" to={`/product/${line.productId}`}>
                <ProductArt type={line.art} color={swatch} alt={line.name} />
              </Link>

              <div>
                <div className="eyebrow">{line.brand}</div>
                <h3>
                  <Link to={`/product/${line.productId}`}>{line.name}</Link>
                </h3>
                <div className="cart-meta">
                  <span>Size: {line.size}</span>
                  <span>Colour: {line.color}</span>
                  <span>{stock <= 4 ? `Only ${stock} left` : 'In stock'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div className="qty">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={line.quantity <= 1 || busyLine === line.lineId}
                      onClick={() => changeQty(line, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={line.quantity >= stock || busyLine === line.lineId}
                      onClick={() => changeQty(line, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="line-actions">
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => product && toggleWishlist(product, 'cart')}
                    >
                      Move to wishlist
                    </button>
                    <button type="button" className="btn-link" onClick={() => removeFromCart(line)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <div className="line-total" style={{ textAlign: 'right' }}>
                <div className="price">{inr(line.price * line.quantity)}</div>
                <div className="mrp">{inr(line.mrp * line.quantity)}</div>
                <div className="off">{line.discount}% off</div>
              </div>
            </div>
          );
        })}
      </section>

      <aside className="summary">
        <h3>Order summary</h3>

        <div className="sum-row">
          <span>Bag total (MRP)</span>
          <span>{inr(totals.mrpTotal)}</span>
        </div>
        <div className="sum-row">
          <span>Bag discount</span>
          <span className="good">− {inr(totals.bagDiscount)}</span>
        </div>
        {coupon && (
          <div className="sum-row">
            <span>
              Coupon {coupon.code}{' '}
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: 12 }}
                onClick={() => {
                  clearCoupon();
                  toast('Coupon removed', 'info');
                }}
              >
                remove
              </button>
            </span>
            <span className="good">− {inr(totals.couponDiscount)}</span>
          </div>
        )}
        <div className="sum-row">
          <span>Shipping</span>
          <span>{totals.shipping === 0 ? <span className="good">Free</span> : inr(totals.shipping)}</span>
        </div>
        <div className="sum-row">
          <span>GST (5%)</span>
          <span>{inr(totals.tax)}</span>
        </div>
        <div className="sum-row total">
          <span>Total payable</span>
          <span>{inr(totals.total)}</span>
        </div>

        <div className="ship-bar" aria-hidden="true">
          <i style={{ width: `${shipProgress}%` }} />
        </div>
        <div className="coupon-hint">
          {toFreeShipping > 0
            ? `Add ${inr(toFreeShipping)} more for free shipping.`
            : 'Free shipping unlocked on this order.'}
        </div>

        <form
          className="coupon-row"
          onSubmit={async (e) => {
            e.preventDefault();
            setApplying(true);
            try {
              await applyCoupon(code);
              setCode('');
            } catch (err) {
              toast(err.message, 'error');
            } finally {
              setApplying(false);
            }
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Coupon code"
            aria-label="Coupon code"
          />
          <button type="submit" className="btn btn-quiet btn-sm" disabled={applying || !code.trim()}>
            {applying ? 'Applying…' : 'Apply'}
          </button>
        </form>
        <div className="coupon-hint">
          Try{' '}
          {Object.values(COUPONS).map((cp) => (
            <code key={cp.code}>{cp.code}</code>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-accent btn-block"
          onClick={() => {
            track(EVENTS.CHECKOUT_STARTED, {
              cart_value: totals.subtotal,
              total_payable: totals.total,
              item_count: totals.itemCount,
              unique_products: cart.length,
              coupon_code: coupon?.code,
              is_logged_in: Boolean(user),
              products: cart.map((l) => `${l.name} (${l.size}/${l.color}) x${l.quantity}`),
            });
            navigate('/checkout');
          }}
        >
          Proceed to checkout
        </button>

        <p className="muted" style={{ fontSize: 12, marginTop: 14, marginBottom: 0 }}>
          Mock checkout — no payment is taken and no card details are needed.
        </p>
      </aside>
    </div>
  );
}
