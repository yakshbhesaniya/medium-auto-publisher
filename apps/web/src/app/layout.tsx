'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import '@/app/globals.css';

const metadata = {
  title: 'Medium Auto Publisher',
  description: 'AI-powered content creation and publishing platform for Medium',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <html lang="en" className="dark">
      <head>
        <title>{String(metadata.title)}</title>
        <meta name="description" content={metadata.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            toastOptions={{
              style: {
                background: 'rgba(20, 20, 25, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(24px)',
                color: '#FAFAFA',
              },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
