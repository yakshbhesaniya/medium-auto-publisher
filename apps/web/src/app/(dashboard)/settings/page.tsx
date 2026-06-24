'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { User, Key, Bell, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const mediumTokenSchema = z.object({
  mediumToken: z.string().min(1, 'Token is required'),
});

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'medium' | 'ai'>('profile');

  const { data: response, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.auth.me(),
  });

  const user = response?.data;

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    resolver: zodResolver(mediumTokenSchema),
  });

  const updateTokenMutation = useMutation({
    mutationFn: (data: { mediumToken: string }) => api.users.updateMediumToken(data.mediumToken),
    onSuccess: () => {
      toast.success('Medium API token saved securely!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save token');
    },
  });

  const onSaveToken = (data: any) => {
    updateTokenMutation.mutate(data);
  };

  if (isLoading) return <div className="h-96 skeleton rounded-xl"></div>;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account, API integrations, and preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile' ? 'bg-primary/20 text-primary-light border border-primary/30' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4" /> Account Profile
          </button>
          <button 
            onClick={() => setActiveTab('medium')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'medium' ? 'bg-primary/20 text-primary-light border border-primary/30' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            <Key className="w-4 h-4" /> Medium Integration
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="glass-card p-6 md:p-8 rounded-xl animate-scale-in">
              <h3 className="text-xl font-semibold mb-6 pb-4 border-b border-white/10">Profile Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
                  <div className="input-glass opacity-70 cursor-not-allowed">
                    {user?.email}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Email cannot be changed.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Display Name</label>
                  <input 
                    type="text" 
                    className="input-glass" 
                    defaultValue={user?.name || ''} 
                    placeholder="e.g. Jane Doe"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button className="btn-primary">Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'medium' && (
            <div className="glass-card p-6 md:p-8 rounded-xl animate-scale-in">
              <div className="flex items-start gap-4 mb-6 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 1043.63 592.71" className="w-6 h-6 fill-white">
                    <g><path d="M588.67 296.36c0 163.67-131.78 296.35-294.33 296.35S0 460 0 296.36 131.78 0 294.34 0s294.33 132.69 294.33 296.36M911.56 296.36c0 154.06-65.89 279-147.17 279s-147.17-124.94-147.17-279 65.88-279 147.16-279 147.17 124.9 147.17 279M1043.63 296.36c0 138-23.17 249.94-51.76 249.94s-51.75-111.91-51.75-249.94 23.17-249.94 51.75-249.94 51.76 111.9 51.76 249.94"></path></g>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Medium Official API</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    We use the official Medium API. Zero bot risk. 100% compliant.
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit(onSaveToken)} className="space-y-6">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary-light mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">How to get your token:</p>
                    <ol className="list-decimal pl-4 mt-2 space-y-1 text-muted-foreground">
                      <li>Log in to Medium.com</li>
                      <li>Click your profile picture {'>'} Settings</li>
                      <li>Go to <strong>Security and apps</strong></li>
                      <li>Scroll to <strong>Integration tokens</strong></li>
                      <li>Create a new token and paste it below</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Integration Token</label>
                  <input 
                    type="password" 
                    {...register('mediumToken')}
                    className={`input-glass ${errors.mediumToken ? 'border-red-500/50' : ''}`} 
                    placeholder="Enter your 64-character token..."
                  />
                  {errors.mediumToken && <p className="text-red-400 text-sm mt-1">{errors.mediumToken.message as string}</p>}
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? 'Saving securely...' : 'Save Token'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
