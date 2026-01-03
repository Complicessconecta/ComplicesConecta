// src/ai/useLocalAI.ts
// Hook React para gestionar IA local (Legal & Operativa) usando LocalLegalAIWorker

// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import { LocalLegalAIWorker, type LegalRuntimeState, type LoadProgress } from './AIWorker';

export interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface UseLocalAIOptions {
  initialRuntimeState?: LegalRuntimeState;
}

export interface UseLocalAIResult {
  messages: LocalMessage[];
  progress: LoadProgress;
  isReady: boolean;
  sendMessage: (text: string, runtimeStateOverride?: Partial<LegalRuntimeState>) => Promise<void>;
}

const DEFAULT_PROGRESS: LoadProgress = {
  stage: 'idle',
  percent: 0,
  message: undefined,
};

export function useLocalAI(options?: UseLocalAIOptions): UseLocalAIResult {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [progress, setProgress] = useState<LoadProgress>(DEFAULT_PROGRESS);
  const [isReady, setIsReady] = useState(false);

  const runtimeStateRef = useRef<LegalRuntimeState | undefined>(options?.initialRuntimeState);
  const workerRef = useRef<LocalLegalAIWorker | null>(null);

  useEffect(() => {
    workerRef.current = new LocalLegalAIWorker({
      onProgress: (p) => {
        setProgress(p);
        if (p.stage === 'ready') {
          setIsReady(true);
        }
      },
    });

    // Disparar carga del modelo en segundo plano
    void workerRef.current.loadModel();
  }, []);

  const sendMessage = useCallback<UseLocalAIResult['sendMessage']>(async (text, runtimeStateOverride) => {
    if (!workerRef.current) return;

    // Actualizar runtimeState si se pasa override
    if (runtimeStateOverride) {
      runtimeStateRef.current = {
        ...(runtimeStateRef.current ?? {
          hasActivePrenup: false,
          relationshipStatus: 'ACTIVE' as const,
        }),
        ...runtimeStateOverride,
      };
    }

    const now = new Date();
    const userMessage: LocalMessage = {
      id: `${now.getTime()}-user`,
      role: 'user',
      content: text,
      createdAt: now,
    };

    setMessages((prev) => [...prev, userMessage]);

    const reply = await workerRef.current.generate({
      userMessage: text,
      runtimeState: runtimeStateRef.current,
    });

    const botMessage: LocalMessage = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: reply,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
  }, []);

  return {
    messages,
    progress,
    isReady,
    sendMessage,
  };
}
