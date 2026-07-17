import type { CSSProperties, ReactNode } from "react";

/* ============================================================
   AI Delivery Workbench — Icon set
   Consistent 24-grid stroke glyphs (stroke 1.75, round caps),
   tuned to the clean/technical Cleanroom aesthetic. Authored
   in-house (no external icon CDN) so the prototype is fully
   offline and portable.
   Usage: <Icon name="git-pull-request" size={18} />
   ============================================================ */
const ICONS = {
  "layout-grid": (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  "file-text": (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="8" y1="9" x2="10" y2="9" />
    </>
  ),
  "file-code": (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="10 12 8 14.5 10 17" />
      <polyline points="14 12 16 14.5 14 17" />
    </>
  ),
  "git-pull-request": (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="6" y1="9" x2="6" y2="15" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <polyline points="15.5 12.5 18 15 20.5 12.5" />
    </>
  ),
  "shield-check": (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <polyline points="9 11.5 11 13.5 15 9.5" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6.5L4.7 18.7A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.3-2.3L14 9.5V3" />
      <line x1="7.2" y1="15" x2="16.8" y2="15" />
    </>
  ),
  network: (
    <>
      <rect x="9" y="2" width="6" height="6" rx="1.2" />
      <rect x="2" y="16" width="6" height="6" rx="1.2" />
      <rect x="16" y="16" width="6" height="6" rx="1.2" />
      <path d="M12 8v4M5 16v-2h14v2M12 12v2" />
    </>
  ),
  sliders: (
    <>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1.5" y1="14" x2="6.5" y2="14" />
      <line x1="9.5" y1="8" x2="14.5" y2="8" />
      <line x1="17.5" y1="16" x2="22.5" y2="16" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  "chevron-right": <polyline points="9 18 15 12 9 6" />,
  "chevron-down": <polyline points="6 9 12 15 18 9" />,
  "chevron-left": <polyline points="15 18 9 12 15 6" />,
  "chevrons-up-down": (
    <>
      <polyline points="7 15 12 20 17 15" />
      <polyline points="7 9 12 4 17 9" />
    </>
  ),
  "arrow-right": (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  "arrow-up-right": (
    <>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="8 7 17 7 17 16" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  "alert-triangle": (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <line x1="12" y1="9" x2="12" y2="13.5" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  "alert-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12.5" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>
  ),
  "check-circle": (
    <>
      <path d="M21.8 11.1V12a9.8 9.8 0 1 1-5.8-9" />
      <polyline points="22 4.5 12 14.5 9 11.5" />
    </>
  ),
  "x-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
  circle: <circle cx="12" cy="12" r="9" />,
  "circle-dot": (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  "circle-dashed": (
    <>
      <path d="M10.1 2.2a10 10 0 0 0-3.3 1.4M3.6 6.8a10 10 0 0 0-1.4 3.3M2.2 13.9a10 10 0 0 0 1.4 3.3M6.8 20.4a10 10 0 0 0 3.3 1.4M13.9 21.8a10 10 0 0 0 3.3-1.4M20.4 17.2a10 10 0 0 0 1.4-3.3M21.8 10.1a10 10 0 0 0-1.4-3.3M17.2 3.6a10 10 0 0 0-3.3-1.4" />
    </>
  ),
  play: <polygon points="6 4 20 12 6 20 6 4" />,
  pause: (
    <>
      <rect x="6" y="4.5" width="3.5" height="15" rx="1" />
      <rect x="14.5" y="4.5" width="3.5" height="15" rx="1" />
    </>
  ),
  "rotate-ccw": (
    <>
      <polyline points="2 5 2 11 8 11" />
      <path d="M4.05 15a8.5 8.5 0 1 0 2-8.8L2 11" />
    </>
  ),
  "refresh-cw": (
    <>
      <polyline points="22 5 22 11 16 11" />
      <polyline points="2 19 2 13 8 13" />
      <path d="M4.1 9a8.5 8.5 0 0 1 14-3.2L22 11M2 13l3.9 5.2A8.5 8.5 0 0 0 19.9 15" />
    </>
  ),
  loader: <path d="M21 12a9 9 0 1 1-6.2-8.5" />,
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  ),
  server: (
    <>
      <rect x="2.5" y="3" width="19" height="7" rx="2" />
      <rect x="2.5" y="14" width="19" height="7" rx="2" />
      <line x1="6.5" y1="6.5" x2="6.51" y2="6.5" />
      <line x1="6.5" y1="17.5" x2="6.51" y2="17.5" />
      <line x1="10.5" y1="6.5" x2="17.5" y2="6.5" />
      <line x1="10.5" y1="17.5" x2="17.5" y2="17.5" />
    </>
  ),
  "git-branch": (
    <>
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </>
  ),
  "git-commit": (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <line x1="2" y1="12" x2="8.5" y2="12" />
      <line x1="15.5" y1="12" x2="22" y2="12" />
    </>
  ),
  "git-merge": (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="6" y1="9" x2="6" y2="15" />
      <circle cx="18" cy="9" r="3" />
      <path d="M18 12a9 9 0 0 1-9 6" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  "shield-alert": (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <line x1="12" y1="7.5" x2="12" y2="12" />
      <line x1="12" y1="15" x2="12.01" y2="15" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="5" />
      <path d="M11.5 11.5 21 2" />
      <path d="M16.5 6.5l3 3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" />
      <path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
    </>
  ),
  terminal: (
    <>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </>
  ),
  "list-checks": (
    <>
      <line x1="10" y1="6" x2="20" y2="6" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <line x1="10" y1="18" x2="20" y2="18" />
      <polyline points="3 6 4 7 6.5 4.5" />
      <polyline points="3 12 4 13 6.5 10.5" />
      <polyline points="3 18 4 19 6.5 16.5" />
    </>
  ),
  "clipboard-check": (
    <>
      <rect x="8" y="3" width="8" height="4" rx="1" />
      <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
      <polyline points="9 14 11 16 15 12" />
    </>
  ),
  "more-horizontal": (
    <>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  "external-link": (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20v-1a6 6 0 0 1 12 0v1" />
      <path d="M16.5 4.8a3.5 3.5 0 0 1 0 6.4" />
      <path d="M21 20v-1a6 6 0 0 0-4-5.6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.5 21a1.5 1.5 0 0 1-3 0" />
    </>
  ),
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  tag: (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </>
  ),
  hash: (
    <>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
  "panel-right": (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="14.5" y1="3" x2="14.5" y2="21" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />,
  menu: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </>
  ),
  box: (
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5Z" />
      <path d="M3 8l9 5 9-5" />
      <line x1="12" y1="13" x2="12" y2="21" />
    </>
  ),
  "scroll-text": (
    <>
      <path d="M8 3H4a2 2 0 0 0-2 2v3h6" />
      <path d="M19 17V5a2 2 0 0 0-2-2H7" />
      <path d="M2 8v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-1H7v1a3 3 0 0 1-3 3" />
      <line x1="10" y1="8" x2="16" y2="8" />
      <line x1="10" y1="12" x2="16" y2="12" />
    </>
  ),
  cpu: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <line x1="9" y1="2" x2="9" y2="5" />
      <line x1="15" y1="2" x2="15" y2="5" />
      <line x1="9" y1="19" x2="9" y2="22" />
      <line x1="15" y1="19" x2="15" y2="22" />
      <line x1="2" y1="9" x2="5" y2="9" />
      <line x1="2" y1="15" x2="5" y2="15" />
      <line x1="19" y1="9" x2="22" y2="9" />
      <line x1="19" y1="15" x2="22" y2="15" />
    </>
  ),
  workflow: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <path d="M10 6.5h4a2 2 0 0 1 2 2v5.5" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M12 10a2 2 0 0 0-2 2c0 1.5.5 3 .5 3" />
      <path d="M8.5 8.5A5 5 0 0 1 17 12c0 2-.5 3.5-.5 3.5" />
      <path d="M5.8 6.8A8 8 0 0 1 20 12c0 3-1 5-1 5" />
      <path d="M7 16.5s1-1.5 1-4.5a4 4 0 0 1 8 0" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  readonly name: IconName;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
};

export function Icon({ name, size = 18, strokeWidth = 1.75, className = "", style }: IconProps) {
  const node = ICONS[name];
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {node}
    </svg>
  );
}
