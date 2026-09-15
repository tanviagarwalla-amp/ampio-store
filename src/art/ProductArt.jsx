/**
 * ProductArt — deterministic, category-accurate product illustrations.
 *
 * Every product in the catalog declares an `art` type (tshirt, jeans, saree,
 * sneakers, watch...). The renderer for that type draws the actual garment /
 * accessory silhouette, tinted with the colorway the shopper has selected.
 * No random stock photos, no network requests, and colour variants are real:
 * picking "Olive" repaints the same garment in olive.
 */

const VIEWS = ['front', 'back', 'detail'];

/* ---------------------------------------------------------------- colour utils */

function clamp(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
}

function mix(hex, target, amount) {
  const a = toRgb(hex);
  const b = toRgb(target);
  return toHex(a.map((v, i) => v + (b[i] - v) * amount));
}

function shade(hex, amount) {
  return mix(hex, '#000000', amount);
}

function tint(hex, amount) {
  return mix(hex, '#ffffff', amount);
}

function luminance(hex) {
  const [r, g, b] = toRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Palette derived from the colourway so every garment reads as one material. */
function palette(color) {
  const light = luminance(color) > 0.82;
  return {
    base: color,
    hi: tint(color, light ? 0.25 : 0.16),
    lo: shade(color, 0.16),
    deep: shade(color, light ? 0.24 : 0.34),
    line: light ? shade(color, 0.42) : shade(color, 0.45),
    accent: light ? shade(color, 0.55) : tint(color, 0.55),
    neutral: '#8d8479',
  };
}

/* ---------------------------------------------------------------- renderers */

function Stitch({ d, p, dash = '7 7' }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={p.accent}
      strokeWidth="2.2"
      strokeDasharray={dash}
      strokeLinecap="round"
      opacity="0.75"
    />
  );
}

function tshirt(p, view, o = {}) {
  const hem = o.crop ? 372 : 444;
  const sleeveOut = o.long ? 'L54 332 L104 352 L126 248' : 'L58 156 L96 218 L124 198';
  const body = `M152 92 L116 106 ${sleeveOut} L124 ${hem} Q200 ${hem + 14} 276 ${hem} L276 248 L276 198 L304 218 L342 156 L284 106 L248 92 Q200 134 152 92 Z`;
  const bodyLong = `M152 92 L116 106 L54 332 L104 352 L126 248 L126 ${hem} Q200 ${hem + 14} 274 ${hem} L274 248 L296 352 L346 332 L284 106 L248 92 Q200 134 152 92 Z`;
  return (
    <g>
      <path
        d={o.long ? bodyLong : body}
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* neck rib */}
      <path d="M152 92 Q200 134 248 92" fill={p.hi} stroke={p.line} strokeWidth="3" />
      <path d="M160 100 Q200 138 240 100" fill="none" stroke={p.line} strokeWidth="2" opacity="0.7" />
      {o.polo && view === 'front' && (
        <g>
          <path d="M200 132 L164 96 L152 92 L196 152 Z" fill={p.hi} stroke={p.line} strokeWidth="2.5" />
          <path d="M200 132 L236 96 L248 92 L204 152 Z" fill={p.hi} stroke={p.line} strokeWidth="2.5" />
          <rect x="192" y="140" width="16" height="72" rx="4" fill={p.lo} stroke={p.line} strokeWidth="2" />
          <circle cx="200" cy="162" r="4" fill={p.accent} />
          <circle cx="200" cy="192" r="4" fill={p.accent} />
        </g>
      )}
      {view === 'back' && (
        <g>
          <path d="M138 112 Q200 148 262 112" fill="none" stroke={p.line} strokeWidth="2.5" opacity="0.8" />
          <rect x="188" y="150" width="24" height="16" rx="3" fill={p.hi} stroke={p.line} strokeWidth="1.6" />
        </g>
      )}
      {view === 'front' && !o.polo && o.graphic && (
        <g opacity="0.9">
          <circle cx="200" cy="250" r="46" fill="none" stroke={p.accent} strokeWidth="5" />
          <path d="M176 250 L200 226 L224 250 L200 274 Z" fill={p.accent} />
        </g>
      )}
      <Stitch d={`M130 ${hem - 12} Q200 ${hem + 2} 270 ${hem - 12}`} p={p} />
      {!o.long && <Stitch d="M100 208 L126 190" p={p} dash="6 6" />}
      {!o.long && <Stitch d="M300 208 L274 190" p={p} dash="6 6" />}
    </g>
  );
}

function shirt(p, view) {
  return (
    <g>
      <path
        d="M150 96 L112 108 L56 168 L98 228 L124 206 L124 452 L276 452 L276 206 L302 228 L344 168 L288 108 L250 96 L200 124 Z"
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {view === 'front' ? (
        <g>
          <path d="M200 124 L150 96 L146 104 L190 152 Z" fill={p.hi} stroke={p.line} strokeWidth="2.5" />
          <path d="M200 124 L250 96 L254 104 L210 152 Z" fill={p.hi} stroke={p.line} strokeWidth="2.5" />
          <rect x="190" y="124" width="20" height="326" fill={p.lo} stroke={p.line} strokeWidth="2" />
          {[176, 226, 276, 326, 376, 424].map((y) => (
            <circle key={y} cx="200" cy={y} r="4.2" fill={p.accent} />
          ))}
          <path d="M138 214 L190 210 L188 258 L142 260 Z" fill="none" stroke={p.line} strokeWidth="2.4" />
        </g>
      ) : (
        <g>
          <path d="M132 150 L268 150" stroke={p.line} strokeWidth="2.5" opacity="0.8" />
          <path d="M168 150 L168 170 M232 150 L232 170" stroke={p.line} strokeWidth="2" opacity="0.6" />
        </g>
      )}
      <Stitch d="M124 438 L276 438" p={p} />
      <Stitch d="M104 218 L126 200" p={p} dash="6 6" />
      <Stitch d="M296 218 L274 200" p={p} dash="6 6" />
    </g>
  );
}

function kurta(p, view) {
  return (
    <g>
      <path
        d="M154 96 L114 110 L62 186 L104 246 L128 224 L128 474 Q200 488 272 474 L272 224 L296 246 L338 186 L286 110 L246 96 Q200 128 154 96 Z"
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M168 96 Q200 124 232 96 L236 116 Q200 144 164 116 Z" fill={p.hi} stroke={p.line} strokeWidth="2.6" />
      {view === 'front' ? (
        <g>
          <path d="M200 140 L200 272" stroke={p.line} strokeWidth="2.4" />
          {[168, 206, 244].map((y) => (
            <circle key={y} cx="200" cy={y} r="4.4" fill={p.accent} />
          ))}
          <g opacity="0.85">
            {[150, 176, 202, 228, 254].map((y) => (
              <g key={y}>
                <circle cx="176" cy={y} r="3" fill={p.accent} />
                <circle cx="224" cy={y} r="3" fill={p.accent} />
              </g>
            ))}
          </g>
        </g>
      ) : (
        <path d="M142 128 Q200 160 258 128" fill="none" stroke={p.line} strokeWidth="2.4" opacity="0.8" />
      )}
      {/* side slits */}
      <path d="M128 386 L128 470 M272 386 L272 470" stroke={p.line} strokeWidth="2.4" opacity="0.75" />
      <Stitch d="M134 462 Q200 476 266 462" p={p} />
    </g>
  );
}

function dress(p, view) {
  return (
    <g>
      <path
        d="M158 100 L124 112 L98 152 L130 180 L142 154 L142 254 L82 476 Q200 502 318 476 L258 254 L258 154 L270 180 L302 152 L276 112 L242 100 Q200 140 158 100 Z"
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M158 100 Q200 140 242 100" fill={p.hi} stroke={p.line} strokeWidth="2.6" />
      <path d="M142 254 Q200 270 258 254" fill="none" stroke={p.line} strokeWidth="3" />
      {view === 'front' ? (
        <g opacity="0.7">
          {[-56, -28, 0, 28, 56].map((dx) => (
            <path
              key={dx}
              d={`M${200 + dx * 0.4} 268 L${200 + dx * 1.7} 474`}
              stroke={p.line}
              strokeWidth="1.8"
              fill="none"
            />
          ))}
        </g>
      ) : (
        <g>
          <path d="M200 120 L200 250" stroke={p.line} strokeWidth="2.2" opacity="0.8" />
          <path d="M194 148 L206 148 M194 158 L206 158" stroke={p.line} strokeWidth="2" opacity="0.6" />
        </g>
      )}
      <Stitch d="M92 470 Q200 494 308 470" p={p} />
    </g>
  );
}

function saree(p, view) {
  return (
    <g>
      {/* draped skirt */}
      <path
        d="M132 188 L94 466 Q200 492 306 466 L268 188 Q200 206 132 188 Z"
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <g opacity="0.65">
        {[-40, -14, 12, 38].map((dx) => (
          <path key={dx} d={`M${200 + dx} 200 L${200 + dx * 1.9} 460`} stroke={p.line} strokeWidth="1.8" fill="none" />
        ))}
      </g>
      {/* hem border */}
      <path d="M98 436 Q200 462 302 436 L306 466 Q200 492 94 466 Z" fill={p.deep} stroke={p.line} strokeWidth="2.4" />
      <g opacity="0.9">
        {[120, 160, 200, 240, 280].map((x) => (
          <circle key={x} cx={x} cy={456} r="3.4" fill={p.accent} />
        ))}
      </g>
      {/* blouse */}
      <path d="M138 128 L160 104 L200 124 L240 104 L262 128 L256 190 Q200 206 144 190 Z" fill={p.lo} stroke={p.line} strokeWidth="2.8" />
      {view === 'front' && (
        <g>
          {/* pallu draped over shoulder */}
          <path
            d="M148 186 L214 58 L286 92 L212 224 Z"
            fill={p.hi}
            stroke={p.line}
            strokeWidth="2.8"
            strokeLinejoin="round"
            opacity="0.96"
          />
          <path d="M226 66 L294 100" stroke={p.accent} strokeWidth="6" />
          <path d="M160 190 L232 218" stroke={p.accent} strokeWidth="6" />
        </g>
      )}
      {view === 'back' && <path d="M200 130 L200 190" stroke={p.line} strokeWidth="2.2" opacity="0.7" />}
    </g>
  );
}

function pants(p, view, o = {}) {
  const hem = o.shorts ? 330 : 470;
  const inner = o.shorts ? 288 : 318;
  const flare = o.wide ? 26 : 0;
  return (
    <g>
      <path
        d={`M126 176 L${112 - flare} ${hem} L${192 - flare} ${hem} L200 ${inner} L${208 + flare} ${hem} L${288 + flare} ${hem} L274 176 Q200 194 126 176 Z`}
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* waistband */}
      <path d="M124 142 Q200 160 276 142 L276 180 Q200 198 124 180 Z" fill={p.lo} stroke={p.line} strokeWidth="3" />
      {view === 'front' ? (
        <g>
          <path d="M200 182 L200 252" stroke={p.line} strokeWidth="2.4" />
          <path d="M186 186 Q188 220 196 244" fill="none" stroke={p.accent} strokeWidth="2.2" strokeDasharray="6 6" />
          <path d="M130 186 Q158 212 172 190" fill="none" stroke={p.line} strokeWidth="2.4" />
          <path d="M270 186 Q242 212 228 190" fill="none" stroke={p.line} strokeWidth="2.4" />
          {o.jeans && (
            <g>
              <rect x="192" y="156" width="18" height="12" rx="3" fill={p.hi} stroke={p.line} strokeWidth="1.6" />
              <path d="M148 150 L148 178 M252 150 L252 178" stroke={p.line} strokeWidth="2.2" />
            </g>
          )}
        </g>
      ) : (
        <g>
          <rect x="140" y="196" width="52" height="46" rx="5" fill="none" stroke={p.accent} strokeWidth="2.4" strokeDasharray="6 5" />
          <rect x="208" y="196" width="52" height="46" rx="5" fill="none" stroke={p.accent} strokeWidth="2.4" strokeDasharray="6 5" />
          <path d="M124 190 Q200 208 276 190" fill="none" stroke={p.line} strokeWidth="2.2" />
        </g>
      )}
      <Stitch d={`M${118 - flare} ${hem - 16} L${188 - flare} ${hem - 16}`} p={p} />
      <Stitch d={`M${212 + flare} ${hem - 16} L${282 + flare} ${hem - 16}`} p={p} />
    </g>
  );
}

function skirt(p, view) {
  return (
    <g>
      <path
        d="M132 174 L96 424 Q200 450 304 424 L268 174 Q200 192 132 174 Z"
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M130 146 Q200 164 270 146 L272 182 Q200 200 128 182 Z" fill={p.lo} stroke={p.line} strokeWidth="3" />
      {view === 'front' ? (
        <g opacity="0.7">
          {[-46, -22, 2, 26, 50].map((dx) => (
            <path key={dx} d={`M${200 + dx * 0.8} 190 L${200 + dx * 1.6} 420`} stroke={p.line} strokeWidth="1.8" fill="none" />
          ))}
        </g>
      ) : (
        <path d="M200 150 L200 420" stroke={p.line} strokeWidth="2.2" opacity="0.7" />
      )}
      <Stitch d="M104 416 Q200 442 296 416" p={p} />
    </g>
  );
}

function jacket(p, view) {
  return (
    <g>
      <path
        d="M150 100 L108 116 L58 210 L102 262 L128 240 L128 456 L272 456 L272 240 L298 262 L342 210 L292 116 L250 100 Z"
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {view === 'front' ? (
        <g>
          <rect x="188" y="118" width="24" height="338" fill={p.deep} stroke={p.line} strokeWidth="2" />
          <path d="M150 100 L200 158 L184 216 L134 134 Z" fill={p.hi} stroke={p.line} strokeWidth="2.6" />
          <path d="M250 100 L200 158 L216 216 L266 134 Z" fill={p.hi} stroke={p.line} strokeWidth="2.6" />
          <path d="M200 170 L200 448" stroke={p.accent} strokeWidth="3" strokeDasharray="4 6" />
          <circle cx="200" cy="300" r="7" fill={p.accent} />
          <path d="M140 330 L186 330" stroke={p.line} strokeWidth="2.6" />
          <path d="M260 330 L214 330" stroke={p.line} strokeWidth="2.6" />
        </g>
      ) : (
        <g>
          <path d="M136 142 Q200 176 264 142" fill="none" stroke={p.line} strokeWidth="2.6" />
          <path d="M200 176 L200 440" stroke={p.line} strokeWidth="2.2" opacity="0.7" />
        </g>
      )}
      <path d="M128 434 Q200 448 272 434" fill={p.lo} stroke={p.line} strokeWidth="2.4" />
    </g>
  );
}

function hoodie(p, view, o = {}) {
  return (
    <g>
      <path
        d="M148 118 L106 134 L52 300 L104 326 L128 246 L128 442 Q200 458 272 442 L272 246 L296 326 L348 300 L294 134 L252 118 Q200 156 148 118 Z"
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {o.hood && (
        <g>
          <path d="M148 118 Q200 52 252 118 Q200 156 148 118 Z" fill={p.lo} stroke={p.line} strokeWidth="3" />
          <path d="M162 116 Q200 142 238 116" fill={p.deep} stroke={p.line} strokeWidth="2.2" />
        </g>
      )}
      {!o.hood && <path d="M152 122 Q200 158 248 122" fill={p.hi} stroke={p.line} strokeWidth="2.8" />}
      {view === 'front' ? (
        <g>
          {o.hood && (
            <g>
              <path d="M180 140 L176 214" stroke={p.accent} strokeWidth="4" strokeLinecap="round" />
              <path d="M220 140 L224 214" stroke={p.accent} strokeWidth="4" strokeLinecap="round" />
              <circle cx="176" cy="218" r="5" fill={p.accent} />
              <circle cx="224" cy="218" r="5" fill={p.accent} />
            </g>
          )}
          <path d="M142 318 L258 318 L252 384 L148 384 Z" fill="none" stroke={p.line} strokeWidth="2.6" />
        </g>
      ) : (
        <path d="M200 150 L200 430" stroke={p.line} strokeWidth="2.2" opacity="0.6" />
      )}
      {/* ribbed cuffs + hem */}
      <path d="M128 422 Q200 438 272 422 L272 442 Q200 458 128 442 Z" fill={p.lo} stroke={p.line} strokeWidth="2.4" />
      <path d="M62 292 L110 312 L104 326 L52 300 Z" fill={p.lo} stroke={p.line} strokeWidth="2.2" />
      <path d="M338 292 L290 312 L296 326 L348 300 Z" fill={p.lo} stroke={p.line} strokeWidth="2.2" />
    </g>
  );
}

function shoe(p, view, o = {}) {
  /* Heeled pump — side profile, toe left. The arch lifts off the ground so the
     stiletto reads as a separate heel rather than part of the sole wedge. */
  if (o.heel) {
    return (
      <g>
        <path
          d="M72 336 Q102 304 148 294 Q174 290 196 286 Q222 276 244 236 L262 256 Q264 290 250 302 Q168 330 72 336 Z"
          fill={p.fill}
          stroke={p.line}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* outsole hugging the arched underside */}
        <path d="M72 336 Q168 330 250 302 L255 318 Q170 346 74 352 Z" fill={p.deep} stroke={p.line} strokeWidth="2.6" />
        {/* stiletto heel + tip plate */}
        <path d="M234 314 L252 308 L270 392 L252 396 Z" fill={p.deep} stroke={p.line} strokeWidth="2.6" />
        <path d="M249 390 L273 386 L275 398 L251 402 Z" fill={p.line} />
        {/* topline + toe seam */}
        <path d="M104 306 Q150 296 196 288 Q216 282 236 256" fill="none" stroke={p.line} strokeWidth="2.4" opacity="0.7" />
        <path d="M86 330 Q106 314 130 304" fill="none" stroke={p.line} strokeWidth="2.2" opacity="0.7" />
        {view === 'front' ? (
          <g>
            {/* ankle strap over the instep */}
            <path d="M246 242 Q264 212 290 204" fill="none" stroke={p.lo} strokeWidth="9" strokeLinecap="round" />
            <path d="M290 204 Q308 202 310 218" fill="none" stroke={p.lo} strokeWidth="9" strokeLinecap="round" />
            <circle cx="252" cy="230" r="6" fill={p.accent} />
          </g>
        ) : (
          <path d="M104 320 Q176 320 246 296" fill="none" stroke={p.accent} strokeWidth="3" strokeDasharray="7 6" />
        )}
      </g>
    );
  }

  /* Flat slide / mule — footbed plus a broad instep band. */
  if (o.flat) {
    return (
      <g>
        {/* footbed */}
        <path
          d="M62 306 Q58 288 86 284 L302 278 Q332 280 334 300 Q336 320 308 324 L92 330 Q64 326 62 306 Z"
          fill={p.fill}
          stroke={p.line}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* outsole shadow strip */}
        <path d="M66 320 Q200 334 330 314 Q332 330 308 336 L94 342 Q68 338 66 320 Z" fill={p.deep} stroke={p.line} strokeWidth="2.4" />
        {/* instep band */}
        <path
          d="M118 292 Q200 226 276 284"
          fill="none"
          stroke={p.lo}
          strokeWidth="26"
          strokeLinecap="round"
        />
        <path
          d="M118 292 Q200 226 276 284"
          fill="none"
          stroke={p.line}
          strokeWidth="2"
          opacity="0.5"
        />
        {view === 'front' ? (
          <g opacity="0.85">
            {/* woven detail on the band */}
            {[-40, -20, 0, 20, 40].map((dx) => (
              <path
                key={dx}
                d={`M${197 + dx} ${252 + Math.abs(dx) * 0.55} l16 12`}
                stroke={p.accent}
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}
          </g>
        ) : (
          <path d="M150 300 L262 296" stroke={p.accent} strokeWidth="2.6" strokeDasharray="6 6" />
        )}
        {/* toe outline */}
        <path d="M86 296 Q120 288 156 286" fill="none" stroke={p.line} strokeWidth="2.2" opacity="0.6" />
      </g>
    );
  }

  /* Sneaker — side profile, toe pointing left, heel collar at right. */
  return (
    <g>
      {/* upper: toe box, vamp, quarter, heel counter */}
      <path
        d="M64 320 C66 272 96 248 148 242 L212 234 C230 231 244 218 250 202 C256 186 274 180 294 186 C314 192 324 210 326 240 L332 320 Z"
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* collar padding */}
      <path
        d="M250 202 C256 186 274 180 294 186 C302 189 308 194 312 202 C296 198 268 199 250 208 Z"
        fill={p.hi}
        stroke={p.line}
        strokeWidth="2.2"
      />
      {/* toe cap seam + quarter panel seam */}
      <path d="M64 320 C78 288 106 272 142 266" fill="none" stroke={p.line} strokeWidth="2.4" opacity="0.8" />
      <path d="M232 226 C246 254 252 288 252 320" fill="none" stroke={p.line} strokeWidth="2.4" opacity="0.8" />
      {/* midsole + outsole */}
      <path
        d="M56 320 L336 320 C350 320 356 330 354 342 C352 356 338 364 318 364 L82 364 C60 364 50 354 50 340 C50 328 50 320 56 320 Z"
        fill={p.hi}
        stroke={p.line}
        strokeWidth="3"
      />
      <path d="M52 344 C140 356 262 356 354 344" fill="none" stroke={p.line} strokeWidth="2" opacity="0.5" />
      {[110, 150, 190, 230, 270, 310].map((x) => (
        <path key={x} d={`M${x} 348 L${x - 6} 362`} stroke={p.line} strokeWidth="1.8" opacity="0.4" />
      ))}
      {view === 'front' ? (
        <g>
          {/* eyestay + laces */}
          <path d="M150 262 C176 286 206 300 238 306" fill="none" stroke={p.line} strokeWidth="2.2" opacity="0.7" />
          {[
            'M158 250 L186 268',
            'M176 240 L204 258',
            'M194 232 L222 248',
          ].map((d) => (
            <path key={d} d={d} stroke={p.accent} strokeWidth="4.5" strokeLinecap="round" />
          ))}
          {/* side stripe */}
          <path
            d="M296 244 C264 276 226 294 182 302"
            fill="none"
            stroke={p.accent}
            strokeWidth="11"
            strokeLinecap="round"
            opacity="0.92"
          />
        </g>
      ) : (
        <g>
          {/* heel counter + pull tab on the reverse */}
          <path d="M300 196 L318 316" stroke={p.line} strokeWidth="2.6" opacity="0.85" />
          <rect x="262" y="228" width="38" height="50" rx="8" fill={p.hi} stroke={p.line} strokeWidth="2.2" />
          <path d="M288 186 C304 182 314 190 316 202" fill="none" stroke={p.lo} strokeWidth="8" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

function handbag(p, view) {
  return (
    <g>
      <path
        d="M100 208 L300 208 L322 412 Q200 436 78 412 Z"
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M100 208 L300 208 L302 232 Q200 250 98 232 Z" fill={p.lo} stroke={p.line} strokeWidth="2.6" />
      <path d="M148 208 Q200 112 252 208" fill="none" stroke={p.deep} strokeWidth="12" strokeLinecap="round" />
      <path d="M148 208 Q200 112 252 208" fill="none" stroke={p.hi} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      {view === 'front' ? (
        <g>
          <rect x="182" y="286" width="36" height="28" rx="6" fill={p.accent} stroke={p.line} strokeWidth="2" />
          <path d="M200 286 L200 314" stroke={p.line} strokeWidth="1.8" opacity="0.7" />
        </g>
      ) : (
        <path d="M110 300 L290 300" stroke={p.line} strokeWidth="2.2" opacity="0.6" />
      )}
      <Stitch d="M92 396 Q200 420 308 396" p={p} />
      <Stitch d="M104 222 Q200 240 296 222" p={p} />
    </g>
  );
}

function watch(p, view) {
  return (
    <g>
      <path d="M170 92 L230 92 L226 196 L174 196 Z" fill={p.lo} stroke={p.line} strokeWidth="3" />
      <path d="M174 304 L226 304 L232 424 L168 424 Z" fill={p.lo} stroke={p.line} strokeWidth="3" />
      {[336, 360, 384].map((y) => (
        <circle key={y} cx="200" cy={y} r="4" fill={p.line} opacity="0.8" />
      ))}
      <circle cx="200" cy="250" r="84" fill={p.hi} stroke={p.line} strokeWidth="3" />
      <circle cx="200" cy="250" r="68" fill={p.fill} stroke={p.line} strokeWidth="2.4" />
      <rect x="282" y="238" width="16" height="24" rx="4" fill={p.lo} stroke={p.line} strokeWidth="2" />
      {view === 'front' ? (
        <g>
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const r = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={200 + Math.sin(r) * 58}
                y1={250 - Math.cos(r) * 58}
                x2={200 + Math.sin(r) * 50}
                y2={250 - Math.cos(r) * 50}
                stroke={p.accent}
                strokeWidth={deg % 90 === 0 ? 4 : 2}
                strokeLinecap="round"
              />
            );
          })}
          <line x1="200" y1="250" x2="200" y2="208" stroke={p.accent} strokeWidth="5" strokeLinecap="round" />
          <line x1="200" y1="250" x2="234" y2="268" stroke={p.accent} strokeWidth="4" strokeLinecap="round" />
          <circle cx="200" cy="250" r="6" fill={p.accent} />
        </g>
      ) : (
        <g>
          <circle cx="200" cy="250" r="40" fill="none" stroke={p.accent} strokeWidth="2.4" strokeDasharray="6 6" />
          <circle cx="200" cy="250" r="16" fill={p.lo} stroke={p.line} strokeWidth="2" />
        </g>
      )}
    </g>
  );
}

function sunglasses(p, view) {
  return (
    <g>
      <path d="M64 208 L128 190 M336 208 L272 190" stroke={p.deep} strokeWidth="8" strokeLinecap="round" />
      <rect x="112" y="184" width="76" height="68" rx="22" fill={p.fill} stroke={p.deep} strokeWidth="6" />
      <rect x="212" y="184" width="76" height="68" rx="22" fill={p.fill} stroke={p.deep} strokeWidth="6" />
      <path d="M188 200 Q200 190 212 200" fill="none" stroke={p.deep} strokeWidth="7" strokeLinecap="round" />
      {view === 'front' ? (
        <g opacity="0.55">
          <path d="M124 236 L160 192" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
          <path d="M224 236 L260 192" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <path d="M112 218 L288 218" stroke={p.line} strokeWidth="2" opacity="0.4" />
          <circle cx="150" cy="218" r="6" fill={p.accent} opacity="0.7" />
          <circle cx="250" cy="218" r="6" fill={p.accent} opacity="0.7" />
        </g>
      )}
    </g>
  );
}

function cap(p, view) {
  return (
    <g>
      <path
        d="M108 262 Q108 138 200 138 Q292 138 292 262 Q200 282 108 262 Z"
        fill={p.fill}
        stroke={p.line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M100 258 Q200 290 300 258 Q316 268 310 292 Q200 326 92 292 Q84 268 100 258 Z" fill={p.lo} stroke={p.line} strokeWidth="3" />
      {view === 'front' ? (
        <g>
          <path d="M200 140 L200 272" stroke={p.line} strokeWidth="2.2" opacity="0.65" />
          <path d="M152 148 Q170 218 168 272" fill="none" stroke={p.line} strokeWidth="2" opacity="0.55" />
          <path d="M248 148 Q230 218 232 272" fill="none" stroke={p.line} strokeWidth="2" opacity="0.55" />
          <circle cx="200" cy="140" r="7" fill={p.accent} />
          <path d="M176 210 L224 210" stroke={p.accent} strokeWidth="7" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <path d="M160 252 L240 252 L240 276 L160 276 Z" fill={p.hi} stroke={p.line} strokeWidth="2.2" />
          <path d="M200 252 L200 276" stroke={p.line} strokeWidth="2" />
        </g>
      )}
    </g>
  );
}

const RENDERERS = {
  tshirt: (p, v) => tshirt(p, v, { graphic: true }),
  polo: (p, v) => tshirt(p, v, { polo: true }),
  top: (p, v) => tshirt(p, v, { crop: true }),
  sweatshirt: (p, v) => hoodie(p, v, { hood: false }),
  hoodie: (p, v) => hoodie(p, v, { hood: true }),
  shirt,
  kurta,
  dress,
  saree,
  jeans: (p, v) => pants(p, v, { jeans: true }),
  trousers: (p, v) => pants(p, v, {}),
  shorts: (p, v) => pants(p, v, { shorts: true }),
  skirt,
  jacket,
  sneakers: (p, v) => shoe(p, v, {}),
  heels: (p, v) => shoe(p, v, { heel: true }),
  flats: (p, v) => shoe(p, v, { flat: true }),
  handbag,
  watch,
  sunglasses,
  cap,
};

export const ART_TYPES = Object.keys(RENDERERS);

const FULL_BOX = '0 0 400 520';
const DETAIL_ZOOM = {
  // All crops keep the 4:5 ratio of the full box so a detail view drops into
  // the same card slot without changing the intrinsic aspect ratio.
  sneakers: '120 155 200 250',
  heels: '105 190 200 250',
  flats: '105 195 200 250',
  handbag: '100 165 200 250',
  watch: '100 145 200 250',
  sunglasses: '100 125 200 250',
  cap: '100 115 200 250',
  jeans: '105 125 200 250',
  trousers: '105 125 200 250',
  shorts: '105 125 200 250',
  skirt: '105 135 200 250',
  saree: '100 115 200 250',
  dress: '105 85 200 250',
  kurta: '105 80 200 250',
  jacket: '105 85 200 250',
  hoodie: '105 95 200 250',
  sweatshirt: '105 95 200 250',
};

function boxFor(type, view) {
  if (view !== 'detail') return FULL_BOX;
  return DETAIL_ZOOM[type] || '105 120 200 250';
}

/**
 * @param {object} props
 * @param {string} props.type  catalog art type (see ART_TYPES)
 * @param {string} props.color hex colourway
 * @param {'front'|'back'|'detail'} props.view
 */
export default function ProductArt({ type, color = '#3f4b5b', view = 'front', className = '', alt }) {
  const renderer = RENDERERS[type] || RENDERERS.tshirt;
  const safeView = VIEWS.includes(view) ? view : 'front';
  const uid = `${type}-${color.replace('#', '')}-${safeView}`;
  // Gradient ids must be unique per palette: SVG url(#id) resolves document-wide,
  // so a shared id would make every card borrow the first card's colours.
  const p = { ...palette(color), fill: `url(#fabric-${uid})` };

  return (
    <svg
      className={`product-art ${className}`}
      viewBox={boxFor(type, safeView)}
      role="img"
      aria-label={alt || `${type} illustration in ${color}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`fabric-${uid}`} x1="0" y1="0" x2="0.55" y2="1">
          <stop offset="0%" stopColor={p.hi} />
          <stop offset="55%" stopColor={p.base} />
          <stop offset="100%" stopColor={p.lo} />
        </linearGradient>
        <radialGradient id={`bg-${uid}`} cx="0.5" cy="0.34" r="0.78">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#efe9e2" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="400" height="520" fill={`url(#bg-${uid})`} />
      <ellipse cx="200" cy="470" rx="132" ry="22" fill="#000" opacity="0.06" />
      {renderer(p, safeView)}
    </svg>
  );
}

export { palette, VIEWS };
