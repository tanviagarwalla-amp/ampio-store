/**
 * Unlinked QA page (/#/art): every illustration renderer, in a few colourways
 * and all three views. Handy when adding a new `art` type to the catalog.
 */

import ProductArt, { ART_TYPES, VIEWS } from '../art/ProductArt';

const COLORS = ['#2a3652', '#c9502c', '#d9c3a0', '#2c4a38'];

export default function ArtSheet() {
  return (
    <div className="shell" style={{ paddingBlock: '30px 70px' }}>
      <div className="listing-toolbar">
        <div>
          <h1>Illustration sheet</h1>
          <div className="muted" style={{ fontSize: 13 }}>
            {ART_TYPES.length} renderers × {VIEWS.length} views — every product image in the catalog comes
            from one of these.
          </div>
        </div>
      </div>

      {ART_TYPES.map((type, i) => (
        <section key={type} style={{ marginBottom: 34 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            {type}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {VIEWS.map((view) => (
              <div key={view} style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                <ProductArt type={type} color={COLORS[i % COLORS.length]} view={view} />
                <div className="muted" style={{ fontSize: 11, padding: '6px 8px', borderTop: '1px solid var(--line)' }}>
                  {view}
                </div>
              </div>
            ))}
            {COLORS.map((c) => (
              <div key={c} style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                <ProductArt type={type} color={c} view="front" />
                <div className="muted" style={{ fontSize: 11, padding: '6px 8px', borderTop: '1px solid var(--line)' }}>
                  {c}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
