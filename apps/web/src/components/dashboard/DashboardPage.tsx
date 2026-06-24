'use client';

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  FileText,
  BookOpen,
  DollarSign,
  Eye,
  Plus,
  Lightbulb,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useDashboardStats, useDashboardCharts } from '@/hooks/useAnalytics';
import StatsCard from './StatsCard';
import { formatDate, getStatusBg, truncate } from '@/lib/utils';

const CHART_COLORS = ['#7C3AED', '#A855F7', '#3B82F6', '#22C55E', '#F59E0B'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong p-3 rounded-xl text-xs">
      <p className="text-zinc-400 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#7C3AED' }} className="font-medium">
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('earn')
            ? `$${p.value.toFixed(2)}`
            : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();

  const viewsData = charts?.dailyViews ?? generateMockViews();
  const revenueData = charts?.monthlyRevenue ?? generateMockRevenue();
  const recentBlogs = stats?.recentBlogs ?? [];
  const statusPieData = stats?.statusDistribution ?? generateMockPie();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, transparent 60%)' }}
        />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Good morning! 👋
            </h2>
            <p className="text-zinc-400 text-sm">
              Here&apos;s what&apos;s happening with your content today.
            </p>
          </div>
          {/* Quick actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/blogs">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
              >
                <Plus className="w-4 h-4" />
                Generate Blog
              </motion.button>
            </Link>
            <Link href="/topics">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Discover Topics
              </motion.button>
            </Link>
            <Link href="/analytics">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <BarChart3 className="w-4 h-4 text-blue-400" />
                View Analytics
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Blogs"
          value={stats?.totalBlogs ?? 0}
          change={12}
          icon={FileText}
          color="violet"
          loading={statsLoading}
        />
        <StatsCard
          title="Published"
          value={stats?.publishedBlogs ?? 0}
          change={8}
          icon={BookOpen}
          color="green"
          loading={statsLoading}
        />
        <StatsCard
          title="Monthly Earnings"
          value={stats?.monthlyEarnings ?? 0}
          change={23}
          icon={DollarSign}
          color="orange"
          prefix="$"
          loading={statsLoading}
        />
        <StatsCard
          title="Total Views"
          value={stats?.totalViews ?? 0}
          change={-4}
          icon={Eye}
          color="blue"
          loading={statsLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Area chart - daily views */}
        <div className="xl:col-span-2 glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-white">Daily Views</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Last 30 days</p>
            </div>
            <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-lg">
              Live
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={viewsData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#71717A', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#7C3AED"
                strokeWidth={2}
                fill="url(#viewsGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#7C3AED', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart - monthly revenue */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-white">Revenue</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Monthly earnings</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#71717A', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="earnings" fill="#A855F7" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent blogs table */}
        <div className="xl:col-span-2 glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Recent Blogs</h3>
            <Link
              href="/blogs"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {chartsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-12 rounded-xl" />
                ))
              : recentBlogs.slice(0, 5).map((blog: { id: string; title: string; status: string; views?: number; createdAt: string }, i: number) => (
                  <motion.div
                    key={blog.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})` }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate group-hover:text-violet-300 transition-colors">
                        {truncate(blog.title, 50)}
                      </p>
                      <p className="text-xs text-zinc-500">{formatDate(blog.createdAt)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBg(blog.status)}`}>
                      {blog.status}
                    </span>
                    {blog.views !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <Eye className="w-3 h-3" />
                        {blog.views.toLocaleString()}
                      </div>
                    )}
                  </motion.div>
                ))}
            {!chartsLoading && recentBlogs.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No blogs yet. Start creating!
              </div>
            )}
          </div>
        </div>

        {/* Status distribution pie chart */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-base font-semibold text-white mb-4">Blog Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {statusPieData.map((_: unknown, index: number) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusPieData.map((item: { name: string; value: number }, i: number) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-zinc-400 capitalize">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data generators for when API is unavailable
function generateMockViews() {
  return Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}`,
    views: Math.floor(Math.random() * 2000) + 500,
  }));
}

function generateMockRevenue() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month) => ({
    month,
    earnings: Math.floor(Math.random() * 500) + 100,
  }));
}

function generateMockPie() {
  return [
    { name: 'published', value: 12 },
    { name: 'draft', value: 8 },
    { name: 'review', value: 5 },
    { name: 'scheduled', value: 3 },
    { name: 'failed', value: 1 },
  ];
}
