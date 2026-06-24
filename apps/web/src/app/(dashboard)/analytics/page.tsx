'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';

export default function AnalyticsPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['analytics', 'charts'],
    queryFn: () => api.analytics.charts(),
  });

  const charts = response?.data;

  if (isLoading) {
    return <div className="space-y-6">
      <div className="h-8 w-48 skeleton rounded"></div>
      <div className="h-96 skeleton rounded-xl"></div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 skeleton rounded-xl"></div>
        <div className="h-80 skeleton rounded-xl"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Analytics Overview</h1>
        <p className="text-muted-foreground mt-1">
          Detailed breakdown of your content performance and earnings
        </p>
      </div>

      {/* Views Chart (Full Width) */}
      <div className="glass-card p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-6">Views (Last 30 Days)</h3>
        <div className="h-[300px] w-full">
          {charts?.dailyViews && charts.dailyViews.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailyViews} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(new Date(val), 'MMM dd')}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#A1A1AA', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#A1A1AA', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelFormatter={(val) => format(new Date(val), 'MMM dd, yyyy')}
                />
                <Area type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Not enough data for the last 30 days
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-6">Monthly Revenue ($)</h3>
          <div className="h-[250px] w-full">
            {charts?.monthlyEarnings && charts.monthlyEarnings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyEarnings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#A1A1AA', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#A1A1AA', fontSize: 12 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#09090B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Blogs Table */}
        <div className="glass-card p-6 rounded-xl flex flex-col">
          <h3 className="text-lg font-semibold mb-6">Top Performing Blogs</h3>
          <div className="flex-1 overflow-auto">
            {charts?.topBlogs && charts.topBlogs.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-white/5 pb-2">
                    <th className="pb-3 font-medium text-left">Blog Title</th>
                    <th className="pb-3 font-medium text-right">Views</th>
                    <th className="pb-3 font-medium text-right">Read Ratio</th>
                    <th className="pb-3 font-medium text-right">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {charts.topBlogs.map((blog: any, i: number) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3 pr-4 font-medium text-foreground truncate max-w-[200px]">
                        {blog.title}
                      </td>
                      <td className="py-3 pl-4 text-right">{blog.views.toLocaleString()}</td>
                      <td className="py-3 pl-4 text-right">{(blog.readRatio * 100).toFixed(1)}%</td>
                      <td className="py-3 pl-4 text-right text-green-400">${blog.earnings.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Publish blogs to see top performers
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
