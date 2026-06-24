'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileText, Eye, Clock, Star, Edit, Trash2, Globe } from 'lucide-react';
import Link from 'next/link';
import { useBlogs, useDeleteBlog, usePublishBlog } from '@/hooks/useBlogs';
import { cn, getStatusBg, truncate, formatDate } from '@/lib/utils';

const STATUS_TABS = ['All', 'Draft', 'Review', 'Published', 'Scheduled'] as const;

interface Blog {
  id: string;
  title: string;
  status: string;
  wordCount?: number;
  readTime?: number;
  aiScore?: number;
  views?: number;
  createdAt: string;
  coverImageUrl?: string;
}

export default function BlogsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const statusFilter = activeTab === 'All' ? undefined : activeTab.toLowerCase();
  const { data: blogsData, isLoading } = useBlogs({
    status: statusFilter,
    search: search || undefined,
  });
  const deleteBlog = useDeleteBlog();
  const publishBlog = usePublishBlog();

  const blogs: Blog[] = Array.isArray(blogsData) ? blogsData : blogsData?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {blogs.length} article{blogs.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <Link href="/blogs/new">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
          >
            <Plus className="w-4 h-4" />
            Create Blog
          </motion.button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                activeTab === tab
                  ? 'bg-violet-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blogs..."
            className="input-glass pl-9 text-xs w-full"
          />
        </div>
      </div>

      {/* Blog list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.2))' }}
          >
            <FileText className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No blogs found</h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-sm">
            Create your first blog post or generate one from a topic.
          </p>
          <Link href="/blogs/new">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
            >
              <Plus className="w-4 h-4" />
              Create Your First Blog
            </motion.button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        >
          <AnimatePresence>
            {blogs.map((blog) => (
              <motion.div
                key={blog.id}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                exit={{ opacity: 0, height: 0 }}
                layout
                className="glass-card p-4 rounded-2xl flex items-center gap-4 group"
              >
                {/* Thumbnail */}
                <div
                  className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))' }}
                >
                  <FileText className="w-6 h-6 text-violet-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 flex-wrap">
                    <Link href={`/blogs/${blog.id}`}>
                      <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors truncate max-w-md">
                        {truncate(blog.title, 80)}
                      </h3>
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${getStatusBg(blog.status)}`}>
                      {blog.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-zinc-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {blog.readTime ?? '?'} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {blog.wordCount?.toLocaleString() ?? '?'} words
                    </span>
                    {blog.aiScore !== undefined && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        AI Score: {blog.aiScore}/100
                      </span>
                    )}
                    {blog.views !== undefined && blog.views > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {blog.views.toLocaleString()} views
                      </span>
                    )}
                    <span>{formatDate(blog.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {blog.status !== 'published' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => publishBlog.mutate(blog.id)}
                      disabled={publishBlog.isPending}
                      className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
                      title="Publish"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                  <Link href={`/blogs/${blog.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </motion.button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (confirm('Delete this blog?')) deleteBlog.mutate(blog.id);
                    }}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
