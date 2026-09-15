import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductArt from '../art/ProductArt';
import { useStore } from '../store/StoreContext';
import { EVENTS, productProps, track } from '../lib/analytics';
import { inr } from '../lib/format';
import { HeartIcon, StarIcon } from './Icons';

export default function ProductCard({ product, position, listName }) {
  const { wishlist, toggleWishlist } = useStore();
  const navigate = useNavigate();
  const [colorIndex, setColorIndex] = useState(0);
  const color = product.colors[colorIndex];
  const saved = wishlist.includes(product.id);

  const onOpen = () => {
    track(EVENTS.PRODUCT_CLICKED, {
      ...productProps(product, { color: color.name }),
      list_name: listName,
      position,
    });
  };

  return (
    <article className="card">
      <Link className="card-media" to={`/product/${product.slug}`} onClick={onOpen} aria-label={product.name}>
        <ProductArt
          className="front"
          type={product.art}
          color={color.hex}
          view="front"
          alt={`${product.name} in ${color.name}`}
        />
        <ProductArt className="back" type={product.art} color={color.hex} view="back" alt="" />
      </Link>

      <div className="card-flags">
        {product.tags.includes('new') && <span className="flag new">New</span>}
        {product.tags.includes('bestseller') && <span className="flag best">Bestseller</span>}
        {product.discount >= 45 && <span className="flag">{product.discount}% off</span>}
      </div>

      <button
        type="button"
        className={`wish ${saved ? 'on' : ''}`}
        aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        onClick={() => toggleWishlist(product, listName || 'card')}
      >
        <HeartIcon filled={saved} width="17" height="17" />
      </button>

      <div className="card-quick">
        <button
          type="button"
          className="btn btn-primary btn-sm btn-block"
          onClick={() => {
            onOpen();
            navigate(`/product/${product.slug}`);
          }}
        >
          Select size
        </button>
      </div>

      <div className="card-body">
        <div className="card-brand">{product.brand}</div>
        <div className="card-name">{product.name}</div>
        <div className="price-row">
          <span className="price">{inr(product.price)}</span>
          <span className="mrp">{inr(product.mrp)}</span>
          <span className="off">{product.discount}% off</span>
        </div>
        <div className="card-swatches">
          {product.colors.map((c, i) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={c.name}
              className={`dot-swatch ${i === colorIndex ? 'on' : ''}`}
              style={{ background: c.hex }}
              onClick={() => {
                setColorIndex(i);
                track(EVENTS.COLOR_SELECTED, {
                  ...productProps(product, { color: c.name, color_hex: c.hex }),
                  source: 'product_card',
                  list_name: listName,
                });
              }}
            />
          ))}
          <span className="rating-pill" style={{ marginLeft: 'auto' }}>
            <StarIcon className="star" />
            {product.rating}
          </span>
        </div>
      </div>
    </article>
  );
}
