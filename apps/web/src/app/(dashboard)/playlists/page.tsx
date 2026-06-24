'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Playlist, Blog } from '@medium-publisher/types';
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function PlaylistsPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => api.playlists.list(),
  });

  const playlists = response?.data || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Playlists</h1>
          <p className="text-muted-foreground mt-1">
            Organize your blogs into logical series and learning paths
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Create Playlist
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 skeleton rounded-xl"></div>
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border-dashed">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-primary-light" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Group related articles into a structured series to keep your readers engaged longer.
          </p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-glass"
          >
            Create Your First Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist: Playlist) => (
            <a 
              key={playlist.id} 
              href={`/playlists/${playlist.id}`}
              className="glass-card rounded-xl p-6 group hover:border-primary/30 transition-all block"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 group-hover:border-primary/30">
                  <Play className="w-6 h-6 text-primary-light" />
                </div>
                <span className="badge badge-violet">{playlist.blogs?.length || 0} posts</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 line-clamp-1">{playlist.title}</h3>
              <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10">
                {playlist.description || 'No description provided.'}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-white/5">
                <span>{Math.round(playlist.totalReadTime || 0)} min total read</span>
                <span>Created {format(new Date(playlist.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
