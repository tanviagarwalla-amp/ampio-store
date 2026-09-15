import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductArt from '../art/ProductArt';
import ProductCard from '../components/ProductCard';
import { CATEGORY_LABELS, PRODUCTS } from '../data/catalog';
import { EVENTS, track } from '../lib/analytics';
import { ReturnIcon, ShieldIcon, TruckIcon, SparkIcon } from '../components/Icons';

const HERO_TILES = ['w-kurta-straight', 'm-sneakers-court', 'w-saree-kanjivaram', 'm-jacket-bomber'];

const SHOP_BY = [
  { gender: 'women', category: 'kurtas', art: 'kurta', color: '#33456b' },
  { gender: 'women', category: 'dresses', art: 'dress', color: '#28374f' },
  { gender: 'women', category: 'sarees', art: 'saree', color: '#8e2231' },
  { gender: 'men', category: 'tshirts', art: 'tshirt', color: '#2a3652' },
  { gender: 'men', category: 'shirts', art: 'shirt', color: '#a6c4dd' },
  { gender: 'men', category: 'sneakers', art: 'sneakers', color: '#f1efe9' },
  { gender: 'accessories', category: 'watches', art: 'watch', color: '#3f4855' },
  { gender: 'accessories', category: 'handbags', art: 'handbag', color: '#8d5a2b' },
];

function Rail({ title, subtitle, items, listName, href }) {
  useEffect(() => {
    track(EVENTS.PRODUCT_LIST_VIEWED, {
      list_name: listName,
      item_count: items.length,
      placement: 'home',
      products: items.map((p) => p.name),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listName]);

  return (
    <section className="shell section">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {href && (
          <Link className="btn-link" to={href}>
            View all
          </Link>
        )}
      </div>
      <div className="grid">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} position={i + 1} listName={listName} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const newIn = PRODUCTS.filter((p) => p.tags.includes('new')).slice(0, 5);
  const bestsellers = PRODUCTS.filter((p) => p.tags.includes('bestseller')).slice(0, 5);
  const underThousand = PRODUCTS.filter((p) => p.price < 1200).slice(0, 5);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Autumn / Winter Edit</span>
          <h1>
            Wardrobe staples,
            <br />
            priced for the everyday.
          </h1>
          <p>
            Over 30 pieces across Indian wear, western wear, footwear and accessories — every colourway
            rendered, every size tracked. Up to 50% off this week.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary" to="/c/women">
              Shop Women
            </Link>
            <Link className="btn btn-outline" to="/c/men">
              Shop Men
            </Link>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            Free shipping over ₹2,499 · 30-day returns · Cash on delivery available
          </div>
        </div>
        <div className="hero-art">
          {HERO_TILES.map((id) => {
            const p = PRODUCTS.find((x) => x.id === id);
            return (
              <Link className="tile" key={id} to={`/product/${id}`} aria-label={p.name}>
                <ProductArt type={p.art} color={p.colors[0].hex} alt={p.name} />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="shell section">
        <div className="section-head">
          <div>
            <h2>Shop by category</h2>
            <p>Jump straight to the rail you came for.</p>
          </div>
        </div>
        <div className="cat-strip">
          {SHOP_BY.map((tile) => (
            <Link
              className="cat-tile"
              key={`${tile.gender}-${tile.category}`}
              to={`/c/${tile.gender}/${tile.category}`}
            >
              <ProductArt type={tile.art} color={tile.color} alt={CATEGORY_LABELS[tile.category]} />
              <span>{CATEGORY_LABELS[tile.category]}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="value-row">
        <div>
          <TruckIcon />
          <h4>Free shipping over ₹2,499</h4>
          <p>Dispatched in 24 hours from Bengaluru.</p>
        </div>
        <div>
          <ReturnIcon />
          <h4>30-day returns</h4>
          <p>Pickup scheduled from your door, no questions.</p>
        </div>
        <div>
          <ShieldIcon />
          <h4>Secure checkout</h4>
          <p>Card, UPI, netbanking and cash on delivery.</p>
        </div>
        <div>
          <SparkIcon />
          <h4>True-to-colour</h4>
          <p>Every colourway is rendered, not guessed.</p>
        </div>
      </div>

      <Rail
        title="New this week"
        subtitle="Fresh drops across the edit."
        items={newIn}
        listName="Home — New this week"
      />

      <Rail
        title="Bestsellers"
        subtitle="What everyone is putting in their bag."
        items={bestsellers}
        listName="Home — Bestsellers"
        href="/c/women"
      />

      <Rail
        title="Under ₹1,200"
        subtitle="Easy adds that keep the bag total sensible."
        items={underThousand}
        listName="Home — Under 1200"
      />
    </>
  );
}
