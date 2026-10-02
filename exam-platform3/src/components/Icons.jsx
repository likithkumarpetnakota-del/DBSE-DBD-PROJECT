// Minimal stroke-icon set. Kept dependency-free and consistent (24 viewBox, round caps).
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const wrap = (paths, props) => (
  <svg viewBox="0 0 24 24" width={props?.size || 20} height={props?.size || 20} {...base} className={props?.className}>
    {paths}
  </svg>
);

export const IconShield = (p) => wrap(<path d="M12 3l7 3v6c0 4.6-3 7.9-7 9-4-1.1-7-4.4-7-9V6l7-3z" />, p);
export const IconShieldCheck = (p) =>
  wrap(
    <>
      <path d="M12 3l7 3v6c0 4.6-3 7.9-7 9-4-1.1-7-4.4-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>,
    p
  );
export const IconCamera = (p) =>
  wrap(
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.2" />
    </>,
    p
  );
export const IconEye = (p) =>
  wrap(
    <>
      <path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="2.7" />
    </>,
    p
  );
export const IconAlertTriangle = (p) =>
  wrap(
    <>
      <path d="M10.5 3.5 1.8 19a1.5 1.5 0 0 0 1.3 2.2h17.8a1.5 1.5 0 0 0 1.3-2.2L13.5 3.5a1.7 1.7 0 0 0-3 0z" />
      <path d="M12 9.5v4.2" />
      <circle cx="12" cy="17" r="0.4" fill="currentColor" />
    </>,
    p
  );
export const IconClock = (p) =>
  wrap(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>,
    p
  );
export const IconChevronLeft = (p) => wrap(<path d="M14.5 5 8 12l6.5 7" />, p);
export const IconChevronRight = (p) => wrap(<path d="M9.5 5 16 12l-6.5 7" />, p);
export const IconLogOut = (p) =>
  wrap(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>,
    p
  );
export const IconUser = (p) =>
  wrap(
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.4-4 4-6 7.5-6s6.1 2 7.5 6" />
    </>,
    p
  );
export const IconGrid = (p) =>
  wrap(
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
    </>,
    p
  );
export const IconFile = (p) =>
  wrap(
    <>
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 13h6M9 16.5h6" />
    </>,
    p
  );
export const IconCheckCircle = (p) =>
  wrap(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.2 12.3l2.5 2.5 5-5.3" />
    </>,
    p
  );
export const IconXCircle = (p) =>
  wrap(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>,
    p
  );
export const IconFlag = (p) =>
  wrap(
    <>
      <path d="M5 21V4" />
      <path d="M5 4.5h12l-3 3.5 3 3.5H5" />
    </>,
    p
  );
export const IconMenu = (p) => wrap(<path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />, p);
export const IconX = (p) => wrap(<path d="M6 6l12 12M18 6 6 18" />, p);
export const IconLock = (p) =>
  wrap(
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="1.6" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>,
    p
  );
export const IconMail = (p) =>
  wrap(
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1.8" />
      <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
    </>,
    p
  );
export const IconLayers = (p) =>
  wrap(
    <>
      <path d="M12 3.5 3 8.5l9 5 9-5-9-5z" />
      <path d="M3 13l9 5 9-5" />
      <path d="M3 17.5l9 5 9-5" />
    </>,
    p
  );
export const IconWifi = (p) =>
  wrap(
    <>
      <path d="M3 8.5a15.5 15.5 0 0 1 18 0" />
      <path d="M6.3 12.3a10.8 10.8 0 0 1 11.4 0" />
      <path d="M9.6 16a6 6 0 0 1 4.8 0" />
      <circle cx="12" cy="19.3" r="0.6" fill="currentColor" />
    </>,
    p
  );
export const IconDatabase = (p) =>
  wrap(
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" />
      <path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
    </>,
    p
  );
export const IconCpu = (p) =>
  wrap(
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.6" />
      <rect x="9.5" y="9.5" width="5" height="5" />
      <path d="M12 3.5v2.3M12 18.2v2.3M3.5 12h2.3M18.2 12h2.3M6.6 6.6l1.6 1.6M15.8 15.8l1.6 1.6M17.4 6.6l-1.6 1.6M8.2 15.8l-1.6 1.6" />
    </>,
    p
  );
export const IconBrain = (p) =>
  wrap(
    <>
      <path d="M9 4.5a3 3 0 0 0-3 3v.3A3 3 0 0 0 4.5 10.5a3 3 0 0 0 1 5.5A3 3 0 0 0 8 19.5a3 3 0 0 0 1-.2" />
      <path d="M15 4.5a3 3 0 0 1 3 3v.3a3 3 0 0 1 1.5 2.7 3 3 0 0 1-1 5.5 3 3 0 0 1-2.5 3.5 3 3 0 0 1-1-.2" />
      <path d="M9 4.5v15M15 4.5v15" />
    </>,
    p
  );
export const IconActivity = (p) => wrap(<path d="M2.5 12h4l2.2-6.5L13 18l2.3-6H21.5" />, p);
export const IconArrowRight = (p) => wrap(<path d="M4 12h16M13 5l7 7-7 7" />, p);
export const IconBookOpen = (p) =>
  wrap(
    <>
      <path d="M12 6.5c-1.6-1.4-4-2-7-2v13c3 0 5.4.6 7 2 1.6-1.4 4-2 7-2V4.5c-3 0-5.4.6-7 2z" />
      <path d="M12 6.5v13" />
    </>,
    p
  );
export const IconTrendingUp = (p) =>
  wrap(
    <>
      <path d="M3 16.5l6-6 4 4 7-8" />
      <path d="M15.5 6.5H20v4.5" />
    </>,
    p
  );
export const IconVideoOff = (p) =>
  wrap(
    <>
      <path d="M3 3l18 18" />
      <path d="M17 7h1a1 1 0 0 1 1 1v8a1 1 0 0 1-.3.7" />
      <path d="M21 8l-4 3" />
      <path d="M10.5 5H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2.5" />
    </>,
    p
  );
export const IconPlus = (p) => wrap(<path d="M12 5v14M5 12h14" />, p);
export const IconTrash = (p) =>
  wrap(
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>,
    p
  );
export const IconUpload = (p) =>
  wrap(
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </>,
    p
  );

export const IconDownload = (p) =>
  wrap(
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </>,
    p
  );

export const IconSearch = (p) =>
  wrap(
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </>,
    p
  );

export const IconFilter = (p) =>
  wrap(
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    p
  );

export const IconRefreshCw = (p) =>
  wrap(
    <>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>,
    p
  );

export const IconBook = (p) =>
  wrap(
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>,
    p
  );

export const IconFileText = (p) =>
  wrap(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </>,
    p
  );

export const IconServer = (p) =>
  wrap(
    <>
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </>,
    p
  );
