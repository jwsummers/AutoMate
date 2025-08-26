import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { safeInvoke } from '@/utils/safeInvoke';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

type AssistantInvokeResponse = {
  response?: string;
  isMock?: boolean;
  error?: string;
  errorType?: 'quota_exceeded' | string;
  errorDetails?: string;
};

type ChatHistoryItem = { role: 'user' | 'assistant'; content: string };

const SYSTEM_PROMPT =
  'I am Auto-Assist AI, your vehicle maintenance assistant. I can help you with maintenance tips, troubleshooting advice, and general vehicle information.';

const MAX_HISTORY_MESSAGES = 12;

// TS type guard to exclude system messages from history
function isChatMessage(
  m: Message
): m is Message & { role: 'user' | 'assistant' } {
  return m.role === 'user' || m.role === 'assistant';
}

export const useAIAssistant = () => {
  const { isPro } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'system-1',
      role: 'system',
      content: SYSTEM_PROMPT,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Keep a ref that always has the latest messages (avoids stale reads inside callbacks)
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      // Push the user's message first (optimistic UI)
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Non-Pro users get a friendly upsell message and stop here
      if (!isPro) {
        setTimeout(() => {
          const upgradeMessage: Message = {
            id: `assistant-upgrade-${Date.now()}`,
            role: 'assistant',
            content:
              'This feature is available for Pro members. Upgrade to access the AI assistant for personalized maintenance advice and troubleshooting.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, upgradeMessage]);
        }, 350);
        return;
      }

      setIsLoading(true);
      try {
        // Build a compact history (exclude system messages) with proper narrowing
        const history: ChatHistoryItem[] = messagesRef.current
          .filter(isChatMessage)
          .slice(-MAX_HISTORY_MESSAGES)
          .map(({ role, content }) => ({ role, content }));

        // Call edge function via safeInvoke (with timeout)
        const data = await safeInvoke<
          AssistantInvokeResponse,
          { message: string; history: ChatHistoryItem[] }
        >({
          fn: 'ai-assistant',
          body: { message: trimmed, history },
          timeoutMs: 30_000,
        });

        // Quota / upstream errors surfaced by the function
        if (data?.errorType === 'quota_exceeded') {
          toast.error('OpenAI quota exceeded. Please try again later.');
          const quotaMsg: Message = {
            id: `assistant-quota-${Date.now()}`,
            role: 'assistant',
            content:
              "I'm temporarily unavailable due to API usage limits. Please try again later.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, quotaMsg]);
          return;
        }

        if (data?.error) {
          // Edge function chose to return an error payload
          throw new Error(data.errorDetails || data.error);
        }

        // Normal happy path
        const assistantText =
          (data && typeof data.response === 'string' && data.response) ||
          "I'm sorry, I couldn't process your request at the moment.";

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (data?.isMock) {
          toast.info(
            'AI assistant is running in demo mode. Add OPENAI_API_KEY to Supabase secrets to enable full responses.'
          );
        }
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to get a response from the AI assistant.';
        console.error('AI assistant error:', err);
        toast.error(msg);

        const errorMessage: Message = {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content:
            "I'm sorry, I encountered an error while processing your request. Please try again later.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isPro, isLoading]
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 'system-1',
        role: 'system',
        content: SYSTEM_PROMPT,
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    isLoading,
    isPro,
    sendMessage,
    clearMessages,
  };
};
