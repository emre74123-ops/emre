import type { ReactNode } from "react";

export default function MobileMenuIcon({ name }: { name?: string }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10M9.5 20v-6h5v6" /></>,
    building: <><path d="M3 20h18M5 9h14M7 9v9M11 9v9M15 9v9M19 9v9M4 6l8-3 8 3v3H4z" /></>,
    heart: <><path d="M12 20s-8-4.7-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.3-8 10-8 10Z" /><path d="M7 15h3l1.2-2.5L13 16l1.2-2H17" /></>,
    news: <><path d="M5 4h14v16H5z" /><path d="M8 8h4v4H8zM14 8h2M14 11h2M8 15h8M8 18h8" /></>,
    users: <><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 15c3.5 0 5.5 1.7 6 5" /></>,
    phone: <path d="M7 3h4l1 5-2.5 1.5a16 16 0 0 0 5 5L16 12l5 1v4c0 2.2-1.8 4-4 4C9.3 21 3 14.7 3 7c0-2.2 1.8-4 4-4Z" />,
    book: <><path d="M4 5.5c3-1 5.7-.5 8 1.5v13c-2.3-2-5-2.5-8-1.5zM20 5.5c-3-1-5.7-.5-8 1.5v13c2.3-2 5-2.5 8-1.5z" /></>,
    droplet: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name || "home"] || paths.home}</svg>;
}
