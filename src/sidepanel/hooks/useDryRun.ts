import { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../lib/message';
import { buildSearchQuery } from '../lib/filter-utils';
import { DRY_RUN_DEBOUNCE_MS } from '@shared/constants';
import type { GmailFilterCriteria } from '@shared/types/gmail';
import type { GmailMessage } from '@shared/types/gmail';

export function useDryRun(criteria: GmailFilterCriteria) {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const query = buildSearchQuery(criteria);
    if (!query.trim()) {
      setMessages([]);
      setError(null);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await sendMessage<{ messages: GmailMessage[] }>({
          type: 'DRY_RUN',
          query,
        });
        setMessages(result.messages);
      } catch (err) {
        setError((err as Error).message);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    }, DRY_RUN_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [criteria.from, criteria.to, criteria.subject, criteria.query, criteria.hasAttachment]);

  return { messages, isLoading, error };
}
