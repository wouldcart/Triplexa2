import React, { createContext, useContext, useMemo } from 'react';
import { runSmartPrompt } from '@/services/aiRouter';

type AskAIOptions = { timeoutMs?: number; maxRetriesPerProvider?: number; sessionProviderLimit?: number };
type AskAIResult = { provider: string; model: string; text?: string; response_time_ms: number };

type AIRouterContextValue = {
  askAI: (prompt: string, options?: AskAIOptions) => Promise<AskAIResult>;
};

const AIRouterContext = createContext<AIRouterContextValue | null>(null);

export function AIRouterProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<AIRouterContextValue>(() => ({
    askAI: async (prompt: string, options?: AskAIOptions) => {
      return runSmartPrompt(prompt, options);
    },
  }), []);

  return <AIRouterContext.Provider value={value}>{children}</AIRouterContext.Provider>;
}

export function useAI(): AIRouterContextValue {
  const ctx = useContext(AIRouterContext);
  if (!ctx) throw new Error('useAI must be used within AIRouterProvider');
  return ctx;
}