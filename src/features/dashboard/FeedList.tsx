// src/features/dashboard/FeedList.tsx
import { useEffect, useRef } from 'react';
import type { FeedItem as FeedItemType } from '@/store/useStore';
import { useStore } from '@/store/useStore';
import { FeedItem } from './FeedItem';
import { Loader2 } from 'lucide-react';

interface FeedListProps {
  items: FeedItemType[];
}

export function FeedList({ items }: FeedListProps) {
  const fetchDashboardMore = useStore((state) => state.fetchDashboardMore);
  const hasMore = useStore((state) => state.hasMore);
  const loading = useStore((state) => state.loading);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchDashboardMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, fetchDashboardMore]);

  if (items.length === 0 && !loading) {
    return <p className="text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedItem key={`${item.itemType}-${item.id}`} item={item} />
      ))}
      
      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="h-4 w-full" />

      {loading && items.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          You've reached the end of the feed.
        </p>
      )}
    </div>
  );
}
