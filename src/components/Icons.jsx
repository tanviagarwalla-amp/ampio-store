const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const SearchIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.6-3.6" />
  </svg>
);

export const HeartIcon = ({ filled, ...p }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} {...p}>
    <path d="M12 20s-7.2-4.6-7.2-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.2 2.8C19.2 15.4 12 20 12 20z" />
  </svg>
);

export const BagIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 8h14l-1.1 12H6.1L5 8z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </svg>
);

export const UserIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M5 20c1.3-3.6 4-5.2 7-5.2s5.7 1.6 7 5.2" />
  </svg>
);

export const StarIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" width="12" height="12" {...p}>
    <path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.8-5.1 2.8 1-5.7-4.1-4 5.7-.8L12 3.6z" />
  </svg>
);

export const CheckIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12.8l4.4 4.2L19 7" />
  </svg>
);

export const ChevronIcon = (p) => (
  <svg {...base} width="14" height="14" {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const TruckIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 7h10v9H3zM13 10h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </svg>
);

export const ReturnIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 10a8 8 0 1 1 2.6 5.9" />
    <path d="M4 5v5h5" />
  </svg>
);

export const ShieldIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3.5l7 2.6v5.2c0 4.3-2.9 7.6-7 9.2-4.1-1.6-7-4.9-7-9.2V6.1l7-2.6z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </svg>
);

export const SparkIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3.8l1.7 4.5 4.5 1.7-4.5 1.7L12 16.2l-1.7-4.5L5.8 10l4.5-1.7L12 3.8z" />
    <path d="M18.5 16.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9z" />
  </svg>
);
