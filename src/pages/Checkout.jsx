import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductArt from '../art/ProductArt';
import { productById } from '../data/catalog';
import { useStore } from '../store/StoreContext';
import { EVENTS, track } from '../lib/analytics';
import { inr } from '../lib/format';
import { CheckIcon } from '../components/Icons';

const STEPS = [
  { key: 'address', label: 'Address' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
];

/**
 * Payment is deliberately mocked: no card number, CVV or UPI PIN is ever
 * collected. Selecting a method picks a pre-defined test instrument.
 */
const PAYMENTS = [
  { key: 'upi', title: 'UPI', blurb: 'Pay with any UPI app · test handle shopper@ampio' },
  { key: 'card', title: 'Saved card', blurb: 'Test card ending 4242 · nothing is charged' },
  { key: 'netbanking', title: 'Netbanking', blurb: 'Simulated bank redirect' },
  { key: 'cod', title: 'Cash on delivery', blurb: 'Pay the courier when it arrives' },
];

const BLANK_ADDRESS = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: 'Karnataka',
  pincode: '',
  type: 'Home',
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, totals, coupon, user, placeOrder, toast } = useStore();
  const [step, setStep] = useState('address');
  const [address, setAddress] = useState(() => ({
    ...BLANK_ADDRESS,
    fullName: user?.name || '',
  }));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [placing, setPlacing] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  useEffect(() => {
    if (cart.length === 0 && !placing) navigate('/cart', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  useEffect(() => {
    track(EVENTS.CHECKOUT_STEP_VIEWED, {
      step_number: stepIndex + 1,
      step_name: step,
      cart_value: totals.subtotal,
      item_count: totals.itemCount,
      is_logged_in: Boolean(user),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const set = (key) => (e) => {
    setAddress((a) => ({ ...a, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateAddress = () => {
    const next = {};
    if (!address.fullName.trim()) next.fullName = 'Required';
    if (!/^\d{10}$/.test(address.phone.replace(/\s/g, ''))) next.phone = 'Enter a 10-digit number';
    if (!address.line1.trim()) next.line1 = 'Required';
    if (!address.city.trim()) next.city = 'Required';
    if (!/^\d{6}$/.test(address.pincode)) next.pincode = 'Enter a 6-digit PIN';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goPayment = () => {
    if (!validateAddress()) {
      setFormError('Check the highlighted fields.');
      return;
    }
    setFormError('');
    track(EVENTS.CHECKOUT_STEP_COMPLETED, {
      step_number: 1,
      step_name: 'address',
      address_type: address.type,
      city: address.city,
      state: address.state,
      is_logged_in: Boolean(user),
    });
    setStep('payment');
  };

  const goReview = () => {
    if (!paymentMethod) {
      setFormError('Choose a payment method to continue.');
      return;
    }
    setFormError('');
    track(EVENTS.CHECKOUT_STEP_COMPLETED, {
      step_number: 2,
      step_name: 'payment',
      payment_method: paymentMethod,
    });
    setStep('review');
  };

  const submit = async () => {
    setPlacing(true);
    setFormError('');
    try {
      const order = await placeOrder({ address, paymentMethod });
      track(EVENTS.CHECKOUT_STEP_COMPLETED, {
        step_number: 3,
        step_name: 'review',
        order_id: order.id,
        payment_method: paymentMethod,
      });
      navigate(`/order/${order.id}`, { replace: true });
    } catch (err) {
      setFormError(err.message);
      toast(err.message, 'error');
      setPlacing(false);
    }
  };

  const lines = useMemo(
    () =>
      cart.map((line) => ({
        ...line,
        swatch: productById(line.productId)?.colors.find((c) => c.name === line.color)?.hex || '#888',
      })),
    [cart],
  );

  return (
    <div className="shell">
      <div className="stepper">
        {STEPS.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`step ${step === s.key ? 'on' : ''} ${i < stepIndex ? 'done' : ''}`}>
              <i>{i < stepIndex ? <CheckIcon width="13" height="13" /> : i + 1}</i>
              {s.label}
            </div>
            {i < STEPS.length - 1 && <span className="step-sep" />}
          </div>
        ))}
      </div>

      <div className="checkout">
        <section>
          {formError && <div className="form-error">{formError}</div>}

          {!user && (
            <div className="mock-note" style={{ marginBottom: 18 }}>
              Checking out as a guest. <Link to="/login">Log in</Link> to save this order to your account and
              keep your bag across devices.
            </div>
          )}

          {step === 'address' && (
            <div className="panel">
              <h2>Delivery address</h2>
              <p className="sub">Where should this order go?</p>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="fullName">Full name</label>
                  <input id="fullName" value={address.fullName} onChange={set('fullName')} autoComplete="name" />
                  {errors.fullName && <span className="err">{errors.fullName}</span>}
                </div>
                <div className="field">
                  <label htmlFor="phone">Phone number</label>
                  <input
                    id="phone"
                    value={address.phone}
                    onChange={set('phone')}
                    inputMode="numeric"
                    placeholder="10-digit mobile"
                    autoComplete="tel"
                  />
                  {errors.phone && <span className="err">{errors.phone}</span>}
                </div>
                <div className="field wide">
                  <label htmlFor="line1">Flat / house no, building</label>
                  <input id="line1" value={address.line1} onChange={set('line1')} autoComplete="address-line1" />
                  {errors.line1 && <span className="err">{errors.line1}</span>}
                </div>
                <div className="field wide">
                  <label htmlFor="line2">Area, street, landmark (optional)</label>
                  <input id="line2" value={address.line2} onChange={set('line2')} autoComplete="address-line2" />
                </div>
                <div className="field">
                  <label htmlFor="city">City</label>
                  <input id="city" value={address.city} onChange={set('city')} autoComplete="address-level2" />
                  {errors.city && <span className="err">{errors.city}</span>}
                </div>
                <div className="field">
                  <label htmlFor="state">State</label>
                  <select id="state" value={address.state} onChange={set('state')}>
                    {[
                      'Karnataka',
                      'Maharashtra',
                      'Delhi',
                      'Tamil Nadu',
                      'Telangana',
                      'West Bengal',
                      'Gujarat',
                      'Rajasthan',
                      'Kerala',
                      'Uttar Pradesh',
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="pincode">PIN code</label>
                  <input
                    id="pincode"
                    value={address.pincode}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))
                    }
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                  {errors.pincode && <span className="err">{errors.pincode}</span>}
                </div>
                <div className="field">
                  <label htmlFor="type">Address type</label>
                  <select id="type" value={address.type} onChange={set('type')}>
                    <option>Home</option>
                    <option>Work</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 22, display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-primary" onClick={goPayment}>
                  Continue to payment
                </button>
                <Link className="btn btn-quiet" to="/cart">
                  Back to bag
                </Link>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="panel">
              <h2>Payment method</h2>
              <p className="sub">Pick how you would like to pay.</p>
              <div className="mock-note">
                This is a demo storefront. No real payment is processed and no card, CVV or UPI PIN is ever
                collected — each option selects a pre-defined test instrument.
              </div>
              {PAYMENTS.map((pm) => (
                <label className={`pay-option ${paymentMethod === pm.key ? 'on' : ''}`} key={pm.key}>
                  <input
                    type="radio"
                    name="payment"
                    value={pm.key}
                    checked={paymentMethod === pm.key}
                    onChange={() => {
                      setPaymentMethod(pm.key);
                      setFormError('');
                      track(EVENTS.PAYMENT_METHOD_SELECTED, {
                        payment_method: pm.key,
                        cart_value: totals.subtotal,
                        total_payable: totals.total,
                      });
                    }}
                  />
                  <div>
                    <h4>{pm.title}</h4>
                    <p>{pm.blurb}</p>
                  </div>
                </label>
              ))}
              <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-primary" onClick={goReview}>
                  Review order
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setStep('address')}>
                  Back
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="panel">
              <h2>Review and place order</h2>
              <p className="sub">One last look before we pack it.</p>

              <div className="kv">
                <div>
                  <span>Deliver to</span>
                  <b>{address.fullName}</b>
                </div>
                <div>
                  <span>Address</span>
                  <b>
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state}{' '}
                    {address.pincode}
                  </b>
                </div>
                <div>
                  <span>Phone</span>
                  <b>{address.phone}</b>
                </div>
                <div>
                  <span>Payment</span>
                  <b>{PAYMENTS.find((p) => p.key === paymentMethod)?.title}</b>
                </div>
              </div>

              {lines.map((line) => (
                <div className="mini-line" key={line.lineId}>
                  <div className="thumb-box">
                    <ProductArt type={line.art} color={line.swatch} alt="" />
                  </div>
                  <div>
                    <strong>{line.name}</strong>
                    <div className="muted">
                      {line.brand} · {line.size} · {line.color} · Qty {line.quantity}
                    </div>
                  </div>
                  <div>{inr(line.price * line.quantity)}</div>
                </div>
              ))}

              <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-accent" onClick={submit} disabled={placing}>
                  {placing && <span className="spinner" />}
                  {placing ? 'Placing order…' : `Place order · ${inr(totals.total)}`}
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setStep('payment')} disabled={placing}>
                  Back
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="summary">
          <h3>Order total</h3>
          <div className="sum-row">
            <span>
              Items ({totals.itemCount})
            </span>
            <span>{inr(totals.subtotal)}</span>
          </div>
          <div className="sum-row">
            <span>Bag discount</span>
            <span className="good">− {inr(totals.bagDiscount)}</span>
          </div>
          {coupon && (
            <div className="sum-row">
              <span>Coupon {coupon.code}</span>
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
            <span>Payable</span>
            <span>{inr(totals.total)}</span>
          </div>
          <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
            Estimated delivery in 3–5 working days.
          </p>
        </aside>
      </div>
    </div>
  );
}
