import TopicDetails from '@/components/topics/TopicDetails';
import { use } from 'react';

export default function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <TopicDetails id={resolvedParams.id} />;
}
