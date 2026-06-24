'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Plus } from 'lucide-react';
import { useCreateTopic } from '@/hooks/useTopics';

const topicSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
  source: z.string().optional(),
});

type TopicForm = z.infer<typeof topicSchema>;

const CATEGORIES = [
  'Technology', 'Programming', 'AI/ML', 'Web Development', 'Career',
  'Productivity', 'Business', 'Science', 'Design', 'Other',
];

const SOURCES = ['Manual', 'Reddit', 'HackerNews', 'Trending', 'Custom'];

interface AddTopicModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddTopicModal({ open, onClose }: AddTopicModalProps) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const createTopic = useCreateTopic();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TopicForm>({
    resolver: zodResolver(topicSchema),
  });

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw) && keywords.length < 10) {
      setKeywords((prev) => [...prev, kw]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const onSubmit = async (data: TopicForm) => {
    await createTopic.mutateAsync({ ...data, source: data.source as any, keywords });
    reset();
    setKeywords([]);
    onClose();
  };

  const handleClose = () => {
    reset();
    setKeywords([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
          >
            <div className="glass-strong rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Add New Topic</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Create a new content topic for blog generation
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register('title')}
                    placeholder="e.g., The Future of AI in Software Development"
                    className="input-glass w-full"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    placeholder="Brief description of what this topic is about..."
                    rows={3}
                    className="input-glass w-full resize-none"
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>
                  )}
                </div>

                {/* Category + Source */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Category
                    </label>
                    <select
                      {...register('category')}
                      className="input-glass w-full"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-zinc-900">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Source
                    </label>
                    <select
                      {...register('source')}
                      className="input-glass w-full"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <option value="">Select source</option>
                      {SOURCES.map((src) => (
                        <option key={src} value={src.toLowerCase()} className="bg-zinc-900">
                          {src}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Keywords <span className="text-zinc-500">(up to 10)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                      placeholder="Type and press Enter..."
                      className="input-glass flex-1"
                    />
                    <button
                      type="button"
                      onClick={addKeyword}
                      className="px-3 py-2 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 transition-all text-xs font-medium"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {kw}
                          <button
                            type="button"
                            onClick={() => removeKeyword(kw)}
                            className="hover:text-red-400 transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 btn-glass py-2.5 text-sm"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={createTopic.isPending}
                    className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-50"
                  >
                    {createTopic.isPending ? 'Creating...' : 'Create Topic'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
