'use client';

import { useTopic, useTriggerResearch, useGenerateProposedBlog } from '@/hooks/useTopics';
import { motion } from 'framer-motion';
import { ArrowLeft, FlaskConical, Zap, LayoutList, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { getStatusBg } from '@/lib/utils';
import { useState } from 'react';

export default function TopicDetails({ id }: { id: string }) {
  const { data: topic, isLoading } = useTopic(id);
  const research = useTriggerResearch();
  const generateProposed = useGenerateProposedBlog();
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  if (isLoading) {
    return <div className="text-white p-8">Loading...</div>;
  }

  if (!topic) {
    return <div className="text-white p-8">Topic not found</div>;
  }

  const handleResearch = () => {
    research.mutate(id);
  };

  const handleGenerate = (index: number) => {
    setGeneratingIndex(index);
    generateProposed.mutate(
      { id, index },
      {
        onSettled: () => setGeneratingIndex(null),
      }
    );
  };

  const hasResearch = !!topic.research;
  const plan = topic.proposedPlan;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex items-center gap-4">
        <Link href="/topics" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            {topic.title}
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBg(topic.status)}`}>
              {topic.status}
            </span>
          </h1>
          {topic.description && <p className="text-zinc-400 mt-1">{topic.description}</p>}
        </div>
      </div>

      {/* Action Bar */}
      <div className="glass-card p-4 rounded-2xl flex items-center gap-4 border border-white/10">
        <div className="flex-1">
          {hasResearch ? (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Research Completed
            </div>
          ) : (
            <div className="text-zinc-400 text-sm">
              Research is required before generating blogs.
            </div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleResearch}
          disabled={research.isPending || topic.status === 'IN_PROGRESS'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-50"
        >
          <FlaskConical className="w-4 h-4" />
          {topic.status === 'IN_PROGRESS' ? 'Research in Progress...' : 'Run Deep Research'}
        </motion.button>
      </div>

      {/* AI Proposed Plan */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-400" />
            AI Content Plan
          </h2>
          {plan && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              {plan.type === 'PLAYLIST' ? <LayoutList className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {plan.type === 'PLAYLIST' ? 'Series / Playlist' : 'Single Blog Post'}
            </div>
          )}
        </div>

        {!plan ? (
          <div className="text-center py-8 text-zinc-500">
            <div className="animate-pulse flex justify-center mb-4">
              <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            </div>
            AI is analyzing this topic to propose the best content structure...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Strategy Reasoning</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{plan.reasoning}</p>
            </div>

            {plan.playlistTitle && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">Playlist Title</h3>
                <p className="text-lg text-white font-medium">{plan.playlistTitle}</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300">Proposed Content</h3>
              {plan.blogs.map((blog: any, index: number) => {
                const isGenerating = generatingIndex === index;
                // Check if blog was already generated (topic.blogs has it)
                const existingBlog = topic.blogs?.find((b: any) => b.title === blog.title);

                return (
                  <div key={index} className="bg-white/5 p-5 rounded-xl border border-white/5 flex flex-col gap-3 group hover:border-violet-500/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded">Part {index + 1}</span>
                          <h4 className="text-white font-medium group-hover:text-violet-200 transition-colors">{blog.title}</h4>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">{blog.description}</p>
                      </div>
                      
                      {existingBlog ? (
                        <Link href={`/blogs/${existingBlog.id}`} className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          View Draft
                        </Link>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleGenerate(index)}
                          disabled={!hasResearch || isGenerating}
                          className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50 transition-all"
                          style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          {isGenerating ? 'Generating...' : 'Generate'}
                        </motion.button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
