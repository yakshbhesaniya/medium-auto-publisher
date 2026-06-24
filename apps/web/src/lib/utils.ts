import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'text-zinc-400',
    review: 'text-yellow-400',
    approved: 'text-blue-400',
    published: 'text-green-400',
    scheduled: 'text-purple-400',
    rejected: 'text-red-400',
    pending: 'text-yellow-400',
    in_progress: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  };
  return map[status] ?? 'text-zinc-400';
}

export function getStatusBg(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    review: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    approved: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    published: 'bg-green-500/15 text-green-400 border-green-500/30',
    scheduled: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/15 text-green-400 border-green-500/30',
    failed: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return map[status] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
}
