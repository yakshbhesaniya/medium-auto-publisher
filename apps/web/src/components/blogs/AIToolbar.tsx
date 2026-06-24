'use client';

import { motion } from 'framer-motion';
import {
  Wand2, Flame, Lightbulb, Scissors, Code2, Maximize2, Minimize2,
} from 'lucide-react';

interface AIToolbarProps {
  onAction: (action: string) => void;
  isLoading?: boolean;
}

const tools = [
  { id: 'humanize', label: 'Humanize', icon: Wand2, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20' },
  { id: 'improve_hook', label: 'Hook', icon: Flame, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20' },
  { id: 'add_examples', label: 'Examples', icon: Lightbulb, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20' },
  { id: 'simplify', label: 'Simplify', icon: Scissors, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20' },
  { id: 'technical', label: 'Technical', icon: Code2, color: 'text-green-400 bg-green-500/10 border-green-500/20 hover:bg-green-500/20' },
  { id: 'expand', label: 'Expand', icon: Maximize2, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20' },
  { id: 'shorten', label: 'Shorten', icon: Minimize2, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20' },
];

export default function AIToolbar({ onAction, isLoading }: AIToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-white/[0.03] border border-white/10"
    >
      <span className="text-xs text-zinc-500 font-medium mr-1">AI Tools:</span>
      {tools.map((tool) => (
        <motion.button
          key={tool.id}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAction(tool.id)}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${tool.color}`}
        >
          <tool.icon className="w-3.5 h-3.5" />
          {tool.label}
        </motion.button>
      ))}
      {isLoading && (
        <div className="flex items-center gap-1.5 text-xs text-violet-400 ml-auto">
          <div className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
          Processing...
        </div>
      )}
    </motion.div>
  );
}
