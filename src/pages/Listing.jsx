import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { CATEGORY_LABELS, NAV, categoriesFor } from '../data/catalog';
import { api, SORT_OPTIONS } from '../mock/api';
import { EVENTS, track } from '../lib/analytics';
import { inr, titleCase } from '../lib/format';
import { ChevronIcon } from '../components/Icons';

const EMPTY = { brands: [], colors: [], sizes: [], categories: [] };

export default function Listing({ mode = 'category' }) {
  const { gender, category } = useParams();
  const [params] = useSearchParams();
  const query = params.get('q') || '';

  const [sort, setSort] = useState('recommended');
  const [multi, setMulti] = useState(EMPTY);
  const [maxPrice, setMaxPrice] = useState(0);
  const [minDiscount, setMinDiscount] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const isSale = gender === 'sale';
  const navEntry = NAV.find((n) => n.slug === gender);

  const listName = useMemo(() => {
    if (mode === 'search') return `Search — ${query}`;
    if (mode === 'wishlist') return 'Wishlist';
    if (isSale) return 'Sale';
    if (category) return `${titleCase(gender)} — ${CATEGORY_LABELS[category] || category}`;
    return titleCase(gender || 'All');
  }, [category, gender, isSale, mode, query]);

  // reset facet selections when the shopper changes rail
  useEffect(() => {
    setMulti(EMPTY);
    setMaxPrice(0);
    setMinDiscount(isSale ? 40 : 0);
    setSort('recommended');
  }, [gender, category, query, isSale]);

  const filters = useMemo(
    () => ({
      gender: isSale || mode === 'search' ? undefined : gender,
      category,
      categories: multi.categories,
      brands: multi.brands,
      colors: multi.colors,
      sizes: multi.sizes,
      maxPrice,
      minDiscount,
      q: mode === 'search' ? query : undefined,
    }),
    [category, gender, isSale, maxPrice, minDiscount, mode, multi, query],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listProducts({ filters, sort }).then((res) => {
      if (cancelled) return;
      setData(res);
      setLoading(false);
      track(EVENTS.PRODUCT_LIST_VIEWED, {
        list_name: listName,
        gender: filters.gender,
        category: category || undefined,
        search_query: mode === 'search' ? query : undefined,
        item_count: res.total,
        sort,
        active_filter_count:
          multi.brands.length +
          multi.colors.length +
          multi.sizes.length +
          multi.categories.length +
          (maxPrice ? 1 : 0) +
          (minDiscount ? 1 : 0),
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  const toggleMulti = (group, value) => {
    setMulti((prev) => {
      const has = prev[group].includes(value);
      const next = has ? prev[group].filter((v) => v !== value) : [...prev[group], value];
      track(EVENTS.FILTER_APPLIED, {
        list_name: listName,
        filter_type: group,
        filter_value: value,
        action: has ? 'removed' : 'added',
        selected_count: next.length,
      });
      return { ...prev, [group]: next };
    });
  };

  const clearAll = () => {
    track(EVENTS.FILTERS_CLEARED, { list_name: listName });
    setMulti(EMPTY);
    setMaxPrice(0);
    setMinDiscount(isSale ? 40 : 0);
  };

  const facets = data?.facets || { brands: [], colors: [], sizes: [], priceMax: 5000 };
  const activeCount =
    multi.brands.length +
    multi.colors.length +
    multi.sizes.length +
    multi.categories.length +
    (maxPrice ? 1 : 0) +
    (minDiscount ? 1 : 0);
  const activePills = [
    ...multi.categories.map((v) => ({ group: 'categories', v, label: CATEGORY_LABELS[v] || v })),
    ...multi.brands.map((v) => ({ group: 'brands', v, label: v })),
    ...multi.colors.map((v) => ({ group: 'colors', v, label: v })),
    ...multi.sizes.map((v) => ({ group: 'sizes', v, label: `Size ${v}` })),
  ];

  const railCategories = navEntry ? categoriesFor(gender) : [];

  return (
    <div className="shell">
      <nav className="crumbs">
        <Link to="/">Home</Link>
        <ChevronIcon width="12" height="12" />
        {mode === 'search' ? (
          <span>Search results for “{query}”</span>
        ) : (
          <>
            <Link to={`/c/${gender}`}>{isSale ? 'Sale' : titleCase(gender)}</Link>
            {category && (
              <>
                <ChevronIcon width="12" height="12" />
                <span>{CATEGORY_LABELS[category] || category}</span>
              </>
            )}
          </>
        )}
      </nav>

      <div className="listing">
        <button
          type="button"
          className="filter-toggle"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
        >
          <span>{filtersOpen ? 'Hide filters' : 'Filters & sort'}</span>
          {activeCount > 0 ? <span className="count">{activeCount}</span> : <span>＋</span>}
        </button>

        <aside className={`filters ${filtersOpen ? 'open' : ''}`}>
          <div className="filter-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Filters</h4>
              <button type="button" className="btn-link" onClick={clearAll}>
                Clear all
              </button>
            </div>
          </div>

          {railCategories.length > 0 && !category && (
            <div className="filter-block">
              <h4>Category</h4>
              {railCategories.map((cat) => (
                <label className="check" key={cat}>
                  <input
                    type="checkbox"
                    checked={multi.categories.includes(cat)}
                    onChange={() => toggleMulti('categories', cat)}
                  />
                  {CATEGORY_LABELS[cat] || cat}
                </label>
              ))}
            </div>
          )}

          <div className="filter-block">
            <h4>Brand</h4>
            {facets.brands.map((brand) => (
              <label className="check" key={brand}>
                <input
                  type="checkbox"
                  checked={multi.brands.includes(brand)}
                  onChange={() => toggleMulti('brands', brand)}
                />
                {brand}
              </label>
            ))}
          </div>

          <div className="filter-block">
            <h4>Size</h4>
            <div className="chip-row">
              {facets.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`chip ${multi.sizes.includes(size) ? 'on' : ''}`}
                  onClick={() => toggleMulti('sizes', size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <h4>Colour</h4>
            {facets.colors.slice(0, 14).map((colorName) => (
              <label className="check" key={colorName}>
                <input
                  type="checkbox"
                  checked={multi.colors.includes(colorName)}
                  onChange={() => toggleMulti('colors', colorName)}
                />
                {colorName}
              </label>
            ))}
          </div>

          <div className="filter-block">
            <h4>Max price</h4>
            <input
              className="range"
              type="range"
              min="499"
              max={facets.priceMax}
              step="100"
              value={maxPrice || facets.priceMax}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              onMouseUp={(e) =>
                track(EVENTS.FILTER_APPLIED, {
                  list_name: listName,
                  filter_type: 'max_price',
                  filter_value: Number(e.target.value),
                  action: 'added',
                })
              }
            />
            <div className="muted" style={{ fontSize: 13 }}>
              Up to {inr(maxPrice || facets.priceMax)}
            </div>
          </div>

          <div className="filter-block">
            <h4>Discount</h4>
            {[30, 40, 50].map((d) => (
              <label className="check" key={d}>
                <input
                  type="radio"
                  name="discount"
                  checked={minDiscount === d}
                  onChange={() => {
                    setMinDiscount(d);
                    track(EVENTS.FILTER_APPLIED, {
                      list_name: listName,
                      filter_type: 'min_discount',
                      filter_value: d,
                      action: 'added',
                    });
                  }}
                />
                {d}% and above
              </label>
            ))}
          </div>
        </aside>

        <section>
          <div className="listing-toolbar">
            <div>
              <h1>{listName}</h1>
              <div className="muted" style={{ fontSize: 13 }}>
                {loading ? 'Loading…' : `${data?.total || 0} item${data?.total === 1 ? '' : 's'}`}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span className="eyebrow">Sort by</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  track(EVENTS.SORT_APPLIED, { list_name: listName, sort_by: e.target.value });
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {activePills.length > 0 && (
            <div className="active-filters">
              {activePills.map((pill) => (
                <span className="pill" key={`${pill.group}-${pill.v}`}>
                  {pill.label}
                  <button type="button" onClick={() => toggleMulti(pill.group, pill.v)} aria-label={`Remove ${pill.label}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {loading && (
            <div className="skeleton-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div className="skeleton card-sk" />
                  <div className="skeleton line" style={{ width: '60%' }} />
                  <div className="skeleton line" style={{ width: '40%' }} />
                </div>
              ))}
            </div>
          )}

          {!loading && data?.items.length === 0 && (
            <div className="empty">
              <h2>Nothing matches those filters</h2>
              <p>Try removing a filter or two — the catalog has 30+ pieces.</p>
              <button type="button" className="btn btn-primary" onClick={clearAll}>
                Clear filters
              </button>
            </div>
          )}

          {!loading && data?.items.length > 0 && (
            <div className="grid">
              {data.items.map((p, i) => (
                <ProductCard key={p.id} product={p} position={i + 1} listName={listName} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
