'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  List,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearToken, clearUser, getUserFromStorage } from '@/lib/auth';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Topics', href: '/topics', icon: Lightbulb },
  { label: 'Blogs', href: '/blogs', icon: FileText },
  { label: 'Playlists', href: '/playlists', icon: List },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUserFromStorage();

  const handleLogout = () => {
    clearToken();
    clearUser();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] flex flex-col z-40 border-r border-white/5"
      style={{ background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(24px)' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold gradient-text leading-tight">Medium Auto</p>
            <p className="text-xs text-zinc-500 leading-tight">Publisher</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const active = isActive(item.href);
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  active
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))',
                      border: '1px solid rgba(124,58,237,0.3)',
                      boxShadow: '0 0 20px rgba(124,58,237,0.15)',
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <item.icon
                  className={cn(
                    'w-4.5 h-4.5 relative z-10 flex-shrink-0 transition-colors',
                    active ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  )}
                />
                <span className="relative z-10 flex-1">{item.label}</span>
                {active && (
                  <ChevronRight className="w-3.5 h-3.5 relative z-10 text-violet-400 opacity-70" />
                )}
                {item.badge && (
                  <span className="relative z-10 px-1.5 py-0.5 text-xs rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* User section */}
      <div className="p-4">
        <div className="glass-card p-3 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
            >
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name ?? 'User'}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
