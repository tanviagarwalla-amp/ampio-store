import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductArt, { VIEWS } from '../art/ProductArt';
import ProductCard from '../components/ProductCard';
import { CATEGORY_LABELS } from '../data/catalog';
import { api, variantStock } from '../mock/api';
import { useStore } from '../store/StoreContext';
import { EVENTS, productProps, track } from '../lib/analytics';
import { inr, titleCase } from '../lib/format';
import { ChevronIcon, HeartIcon, ReturnIcon, StarIcon, TruckIcon } from '../components/Icons';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist, toast } = useStore();

  const [state, setState] = useState({ loading: true, product: null, related: [], error: null });
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState('');
  const [view, setView] = useState('front');
  const [adding, setAdding] = useState(false);
  const [sizeError, setSizeError] = useState('');
  const [pincode, setPincode] = useState('');
  const [pinResult, setPinResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, product: null, related: [], error: null });
    setColorIndex(0);
    setSize('');
    setView('front');
    setSizeError('');
    setPinResult(null);
    api
      .getProduct(id)
      .then(({ product, related }) => {
        if (cancelled) return;
        setState({ loading: false, product, related, error: null });
        const onlySize = product.sizes.length === 1 ? product.sizes[0] : '';
        if (onlySize) setSize(onlySize);
        track(EVENTS.PRODUCT_VIEWED, {
          ...productProps(product, {
            color: product.colors[0].name,
            available_sizes: product.sizes.filter((s) => !product.outOfStock.includes(s)).length,
            total_sizes: product.sizes.length,
            reviews: product.reviews,
            is_on_sale: product.discount > 0,
          }),
        });
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, product: null, related: [], error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { loading, product, related, error } = state;

  if (loading) {
    return (
      <div className="shell pdp">
        <div className="skeleton" style={{ aspectRatio: '4 / 5' }} />
        <div>
          <div className="skeleton line" style={{ width: '40%', height: 18 }} />
          <div className="skeleton line" style={{ width: '70%', height: 26 }} />
          <div className="skeleton line" style={{ width: '30%', height: 22 }} />
          <div className="skeleton line" style={{ width: '100%', height: 120 }} />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="shell" style={{ paddingBlock: '60px' }}>
        <div className="empty">
          <h2>{error || 'Product not found'}</h2>
          <p>It may have sold out or been renamed.</p>
          <Link className="btn btn-primary" to="/">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const color = product.colors[colorIndex];
  const saved = wishlist.includes(product.id);
  const stock = size ? variantStock(product.id, size, color.name) : 0;
  const isOneSize = product.sizes.length === 1;

  const onAdd = async () => {
    if (!size && !isOneSize) {
      setSizeError('Please select a size');
      toast('Select a size first', 'error');
      return;
    }
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        size: size || product.sizes[0],
        color: color.name,
        quantity: 1,
        source: 'pdp',
      });
      setSizeError('');
    } catch (err) {
      setSizeError(err.message);
      toast(err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const checkPin = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setPinResult({ ok: false, message: 'Enter a valid 6-digit PIN code' });
      return;
    }
    const days = 2 + (Number(pincode) % 4);
    setPinResult({
      ok: true,
      message: `Delivers in ${days}–${days + 2} days · Cash on delivery available`,
    });
    track('Delivery Checked', { ...productProps(product), pincode_prefix: pincode.slice(0, 3), eta_days: days });
  };

  return (
    <div className="shell">
      <nav className="crumbs">
        <Link to="/">Home</Link>
        <ChevronIcon width="12" height="12" />
        <Link to={`/c/${product.gender}`}>{titleCase(product.gender)}</Link>
        <ChevronIcon width="12" height="12" />
        <Link to={`/c/${product.gender}/${product.category}`}>
          {CATEGORY_LABELS[product.category] || product.category}
        </Link>
      </nav>

      <div className="pdp">
        <div className="gallery">
          <div className="thumbs">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                className={`thumb ${view === v ? 'on' : ''}`}
                onClick={() => setView(v)}
                aria-label={`${v} view`}
              >
                <ProductArt type={product.art} color={color.hex} view={v} alt="" />
              </button>
            ))}
          </div>
          <div className="gallery-main">
            <ProductArt
              type={product.art}
              color={color.hex}
              view={view}
              alt={`${product.name} in ${color.name}, ${view} view`}
            />
          </div>
        </div>

        <div className="pdp-info">
          <div className="pdp-brand">{product.brand}</div>
          <h1>{product.name}</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
            <span className="rating-pill">
              <StarIcon className="star" />
              {product.rating}
            </span>
            <span className="muted" style={{ fontSize: 13 }}>
              {product.reviews.toLocaleString('en-IN')} ratings
            </span>
          </div>

          <div className="pdp-price">
            <span className="price">{inr(product.price)}</span>
            <span className="mrp">{inr(product.mrp)}</span>
            <span className="off">{product.discount}% off</span>
            <div className="tax-note">Inclusive of all taxes</div>
          </div>

          <div className="option-head">
            <h3>Colour</h3>
            <span className="value">{color.name}</span>
          </div>
          <div className="swatches">
            {product.colors.map((c, i) => (
              <button
                key={c.name}
                type="button"
                className={`swatch ${i === colorIndex ? 'on' : ''}`}
                title={c.name}
                aria-label={c.name}
                onClick={() => {
                  setColorIndex(i);
                  track(EVENTS.COLOR_SELECTED, {
                    ...productProps(product, { color: c.name, color_hex: c.hex, size: size || undefined }),
                    source: 'pdp',
                    previous_color: color.name,
                  });
                }}
              >
                <span style={{ background: c.hex }} />
              </button>
            ))}
          </div>

          {!isOneSize && (
            <>
              <div className="option-head">
                <h3>Select size</h3>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    track(EVENTS.SIZE_GUIDE_OPENED, productProps(product));
                    toast('Size guide: fits true to size. Between sizes? Take the larger.', 'info');
                  }}
                >
                  Size guide
                </button>
              </div>
              <div className="sizes">
                {product.sizes.map((s) => {
                  const soldOut = product.outOfStock.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      className={`size-btn ${size === s ? 'on' : ''}`}
                      disabled={soldOut}
                      title={soldOut ? 'Sold out' : ''}
                      onClick={() => {
                        setSize(s);
                        setSizeError('');
                        track(EVENTS.SIZE_SELECTED, {
                          ...productProps(product, { size: s, color: color.name }),
                          units_left: variantStock(product.id, s, color.name),
                          source: 'pdp',
                        });
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <div className="stock-note">
                {sizeError
                  ? sizeError
                  : size && stock <= 4
                    ? `Hurry — only ${stock} left in ${size}`
                    : size
                      ? `In stock · ${stock} units`
                      : ''}
              </div>
            </>
          )}

          <div className="pdp-actions">
            <button type="button" className="btn btn-accent" onClick={onAdd} disabled={adding}>
              {adding ? <span className="spinner" /> : null}
              {adding ? 'Adding…' : 'Add to bag'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => toggleWishlist(product, 'pdp')}
              aria-pressed={saved}
            >
              <HeartIcon filled={saved} width="16" height="16" />
              {saved ? 'Saved' : 'Wishlist'}
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ marginBottom: 22 }}
            onClick={async () => {
              if (!size && !isOneSize) {
                setSizeError('Please select a size');
                toast('Select a size first', 'error');
                return;
              }
              await onAdd();
              navigate('/cart');
            }}
          >
            Buy now
          </button>

          <div className="delivery-box">
            <form onSubmit={checkPin} style={{ display: 'flex', gap: 8 }}>
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Delivery PIN code"
                inputMode="numeric"
                aria-label="Delivery PIN code"
                style={{
                  flex: 1,
                  border: '1px solid var(--line-strong)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 12px',
                  background: '#fff',
                }}
              />
              <button type="submit" className="btn btn-quiet btn-sm">
                Check
              </button>
            </form>
            {pinResult && (
              <div style={{ color: pinResult.ok ? 'var(--success)' : 'var(--sale)' }}>{pinResult.message}</div>
            )}
            <div>
              <TruckIcon width="15" height="15" style={{ display: 'inline', verticalAlign: '-3px' }} />{' '}
              <b>Free shipping</b> on orders over ₹2,499
            </div>
            <div>
              <ReturnIcon width="15" height="15" style={{ display: 'inline', verticalAlign: '-3px' }} />{' '}
              <b>30-day returns</b> — free pickup from your address
            </div>
          </div>

          <div className="accordion">
            <details open>
              <summary>Product description</summary>
              <div className="body">{product.desc}</div>
            </details>
            <details>
              <summary>Material & care</summary>
              <div className="body">
                <ul>
                  {product.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            </details>
            <details>
              <summary>Returns & exchange</summary>
              <div className="body">
                Free returns and size exchange within 30 days of delivery, provided tags are intact.
                Refunds land in the original payment method within 5 working days.
              </div>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <div>
              <h2>You may also like</h2>
              <p>More from {product.brand} and {CATEGORY_LABELS[product.category] || product.category}.</p>
            </div>
          </div>
          <div className="grid">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} position={i + 1} listName={`PDP — related to ${product.name}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
