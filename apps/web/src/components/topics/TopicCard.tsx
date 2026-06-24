'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  FlaskConical,
  Zap,
  MoreHorizontal,
  Tag,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useApproveTopic, useRejectTopic, useTriggerResearch, useTriggerGenerate } from '@/hooks/useTopics';
import { getStatusBg, truncate } from '@/lib/utils';

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

const sourceColors: Record<string, string> = {
  reddit: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  hackernews: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  manual: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  trending: 'bg-green-500/15 text-green-400 border-green-500/30',
  default: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

export default function TopicCard({ topic }: { topic: Topic }) {
  const approve = useApproveTopic();
  const reject = useRejectTopic();
  const research = useTriggerResearch();
  const generate = useTriggerGenerate();

  const sourceStyle = sourceColors[topic.source?.toLowerCase() ?? 'default'] ?? sourceColors.default;
  const popularityScore = topic.popularityScore ?? Math.floor(Math.random() * 100);

  const popularityColor =
    popularityScore >= 70 ? 'bg-green-500' : popularityScore >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="glass-card p-5 rounded-2xl group flex flex-col gap-4 h-full relative overflow-hidden">
      {/* Gradient border on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.1))',
          border: '1px solid rgba(124,58,237,0.3)',
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white group-hover:text-violet-200 transition-colors leading-snug mb-1">
            {truncate(topic.title, 70)}
          </h3>
          {topic.description && (
            <p className="text-xs text-zinc-500 leading-relaxed">
              {truncate(topic.description, 90)}
            </p>
          )}
        </div>
        <button className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap relative z-10">
        {/* Status */}
        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBg(topic.status)}`}>
          {topic.status}
        </span>
        {/* Source */}
        {topic.source && (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${sourceStyle}`}>
            {topic.source}
          </span>
        )}
        {/* Category */}
        {topic.category && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
            {topic.category}
          </span>
        )}
      </div>

      {/* Popularity score */}
      <div className="relative z-10">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-zinc-500">Popularity</span>
          <span className="text-zinc-300 font-medium">{popularityScore}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${popularityColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${popularityScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>

      {/* Keywords */}
      {topic.keywords && topic.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 relative z-10">
          {topic.keywords.slice(0, 4).map((kw) => (
            <span
              key={kw}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20"
            >
              <Tag className="w-2.5 h-2.5" />
              {kw}
            </span>
          ))}
          {topic.keywords.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-500">
              +{topic.keywords.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap mt-auto pt-3 border-t border-white/5 relative z-10">
        {topic.status === 'pending' && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => approve.mutate(topic.id)}
              disabled={approve.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => reject.mutate(topic.id)}
              disabled={reject.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </motion.button>
          </>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => research.mutate(topic.id)}
          disabled={research.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-50"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          {research.isPending ? 'Researching...' : 'Research'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => generate.mutate({ id: topic.id })}
          disabled={generate.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50 transition-all"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
        >
          <Zap className="w-3.5 h-3.5" />
          {generate.isPending ? 'Generating...' : 'Generate'}
        </motion.button>

        <Link href={`/topics/${topic.id}`} className="ml-auto p-1.5 rounded-lg text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
