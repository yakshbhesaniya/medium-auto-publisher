'use client';

import { Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your publishing activity' },
  '/topics': { title: 'Topics', subtitle: 'Manage and explore content ideas' },
  '/blogs': { title: 'Blog Posts', subtitle: 'Create and manage your articles' },
  '/playlists': { title: 'Playlists', subtitle: 'Organize your content collections' },
  '/analytics': { title: 'Analytics', subtitle: 'Track performance and earnings' },
  '/settings': { title: 'Settings', subtitle: 'Manage your account preferences' },
};

export default function TopBar() {
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');
  const [hasNotifications] = useState(true);

  const pageKey = Object.keys(pageTitles).find((k) => pathname.startsWith(k)) ?? '/dashboard';
  const { title, subtitle } = pageTitles[pageKey] ?? { title: 'Dashboard', subtitle: '' };

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b border-white/5 sticky top-0 z-30"
      style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(24px)' }}
    >
      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-white leading-tight">{title}</h1>
        <p className="text-xs text-zinc-500 leading-tight">{subtitle}</p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search anything..."
            className="input-glass pl-9 pr-4 py-2 text-xs w-48 focus:w-64 transition-all duration-300"
          />
        </div>

        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200">
          <Bell className="w-4 h-4 text-zinc-400" />
          {hasNotifications && (
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
}
