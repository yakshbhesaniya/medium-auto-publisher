'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Lightbulb } from 'lucide-react';
import { useTopics } from '@/hooks/useTopics';
import TopicCard from './TopicCard';
import AddTopicModal from './AddTopicModal';
import { cn } from '@/lib/utils';

const STATUS_TABS = ['All', 'Trending', 'Pending', 'Approved', 'In Progress', 'Completed', 'Rejected'] as const;

interface Topic {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: string;
  source?: string;
  keywords?: string[];
  popularityScore?: number;
  createdAt: string;
}

export default function TopicsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const isTrending = activeTab === 'Trending';
  const statusFilter = activeTab === 'All' || activeTab === 'Trending' ? undefined : activeTab.toLowerCase().replace(' ', '_');
  const { data: topics, isLoading } = useTopics({
    status: statusFilter,
    isTrending: isTrending ? true : undefined,
    search: search || undefined,
  });

  const topicList: Topic[] = Array.isArray(topics) ? topics : topics?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Topics</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Discover and manage content ideas
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
        >
          <Plus className="w-4 h-4" />
          Add Topic
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Tab filters */}
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

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="input-glass pl-9 text-xs w-full"
          />
        </div>

        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>
      </div>

      {/* Topics grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : topicList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.2))' }}
          >
            <Lightbulb className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No topics found</h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-sm">
            {search
              ? `No topics match "${search}". Try a different search.`
              : 'Start by adding your first content topic to discover and generate blogs.'}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
          >
            <Plus className="w-4 h-4" />
            Add Your First Topic
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          <AnimatePresence>
            {topicList.map((topic) => (
              <motion.div
                key={topic.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <TopicCard topic={topic} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add Topic Modal */}
      <AddTopicModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
