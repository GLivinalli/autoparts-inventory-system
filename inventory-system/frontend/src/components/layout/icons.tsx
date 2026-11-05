const NAV_ICON_CLASS = "shrink-0";

export function IconDashboard({ size = 19 }: { size?: number }) {
  return (
    <svg className={NAV_ICON_CLASS} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}
export function IconParts({ size = 19 }: { size?: number }) {
  return (
    <svg className={NAV_ICON_CLASS} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8V6a2 2 0 0 0-2-2h-2.5L14 2h-4L8.5 4H6a2 2 0 0 0-2 2v2" />
      <path d="M3 8h18l-1.5 12.5A2 2 0 0 1 17.5 22h-11a2 2 0 0 1-2-1.5L3 8Z" />
      <path d="M9 12h6" />
    </svg>
  );
}
export function IconHistory({ size = 19 }: { size?: number }) {
  return (
    <svg className={NAV_ICON_CLASS} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
export function IconUsers({ size = 19 }: { size?: number }) {
  return (
    <svg className={NAV_ICON_CLASS} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
export function IconBox({ size = 19 }: { size?: number }) {
  return (
    <svg className={NAV_ICON_CLASS} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}

