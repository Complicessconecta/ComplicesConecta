/**
 * ChatBot Component - Integración con Phi-3 y moderación avanzada
 * Componente de chatbot con IA nativa para CómplicesConecta
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Shield, AlertCircle } from 'lucide-react';
import { aiIntegrationService, type ChatMessage } from '@/services/ai/AIIntegrationService';
import { logger } from '@/lib/logger';
import * as toxicity from '@tensorflow-models/toxicity';

// Definir tipos específicos para evitar 'any'
interface ToxicityPrediction {
  label: string;
  results: Array<{
    probabilities: Float32Array;
    match: boolean | null;
  }>;
}

interface ToxicityModel {
  classify: (text: string) => Promise<ToxicityPrediction[]>;
}

type ErrorType = unknown;

interface ChatBotProps {
  userId: string;
  className?: string;
  maxMessages?: number;
  enableModeration?: boolean;
  placeholder?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
}

export const ChatBot: React.FC<ChatBotProps> = ({
  userId,
  className = '',
  maxMessages = 50,
  enableModeration = true,
  placeholder = 'Escribe tu mensaje...'
}) => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    isTyping: false
  });

  const [inputValue, setInputValue] = useState('');
  const [toxicityModel, setToxicityModel] = useState<ToxicityModel | null>(null);
  const [isModerationEnabled, setIsModerationEnabled] = useState(enableModeration);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Inicializar modelo de toxicidad
  const initToxicityModel = async () => {
    try {
      const model = await toxicity.load(0.9, ['toxicity', 'severe_toxicity', 'identity_attack', 'insult', 'profanity', 'threat']); // Corregir argumentos de toxicity
      setToxicityModel(model);
      logger.info('✅ Modelo de toxicidad inicializado');
    } catch (error: ErrorType) {
      logger.error('❌ Error inicializando modelo de toxicidad:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      setIsModerationEnabled(false);
    }
  };

  if (enableModeration) {
    initToxicityModel();
  }

  // Auto-scroll al final de los mensajes
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, scrollToBottom]);

  // Verificar toxicidad del mensaje
  const checkToxicity = useCallback(async (text: string): Promise<boolean> => {
    if (!isModerationEnabled || !toxicityModel) return false;

    try {
      const predictions = await toxicityModel.classify(text);
      return predictions.some((prediction: ToxicityPrediction) =>
        prediction.results?.[0]?.match === true
      );
    } catch (error: ErrorType) {
      logger.error('Error verificando toxicidad:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        text: text.substring(0, 100) // Solo primeros 100 caracteres para log
      });
      return false;
    }
  }, [isModerationEnabled, toxicityModel]);

  // Enviar mensaje
  const sendMessage = useCallback(async () => {
    const message = inputValue.trim();
    if (!message || state.isLoading) return;

    // Verificar toxicidad
    if (isModerationEnabled) {
      const isToxic = await checkToxicity(message);
      if (isToxic) {
        setState(prev => ({
          ...prev,
          error: 'Tu mensaje contiene contenido inapropiado. Por favor, sé respetuoso.'
        }));
        return;
      }
    }

    // Limpiar input y estado de error
    setInputValue('');
    setState(prev => ({ ...prev, error: null, isLoading: true, isTyping: true }));

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      metadata: {
        moderated: isModerationEnabled,
        toxicityChecked: isModerationEnabled
      }
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage].slice(-maxMessages)
    }));

    try {
      // Procesar mensaje con IA
      const aiResponse = await aiIntegrationService.processChatMessage(
        userId,
        message,
        state.messages.slice(-10) // Últimos 10 mensajes para contexto
      );

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiResponse].slice(-maxMessages),
        isLoading: false,
        isTyping: false
      }));

      logger.info(`Mensaje procesado para usuario ${userId}`);
    } catch (error: ErrorType) {
      logger.error('Error procesando mensaje:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        messageLength: message.length
      });
      setState(prev => ({
        ...prev,
        error: 'Error al procesar tu mensaje. Inténtalo de nuevo.',
        isLoading: false,
        isTyping: false
      }));
    }
  }, [inputValue, state.isLoading, state.messages, userId, maxMessages, isModerationEnabled, checkToxicity]);

  // Manejar envío con Enter
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Limpiar chat
  const clearChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null
    }));
  }, []);

  // Formatear timestamp
  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Asistente IA</h3>
          {isModerationEnabled && (
            <Shield className="w-4 h-4 text-green-600" />
          )}
        </div>
        <button
          onClick={clearChat}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Limpiar chat"
        >
          Limpiar chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>¡Hola! Soy tu asistente de IA en CómplicesConecta.</p>
            <p className="text-sm mt-2">Puedo ayudarte con matching, tokens o responder preguntas.</p>
          </div>
        ) : (
          state.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 mt-1 shrink-0" />
                  ) : (
                    <Bot className="w-4 h-4 mt-1 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                    {(() => {
                      const model = message.metadata?.model;
                      if (!model) return null;
                      return (
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                        }`}>
                          Model: {String(model)}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {state.isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {state.error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">{state.error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={state.isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            rows={2}
            maxLength={1000}
          />
          <button
            onClick={sendMessage}
            disabled={state.isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            aria-label="Enviar mensaje"
            title="Enviar mensaje"
          >
            <span>{state.isLoading ? 'Enviando...' : 'Enviar'}</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            {inputValue.length}/1000 caracteres
          </p>
          {isModerationEnabled && (
            <p className="text-xs text-green-600 flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Moderación activa</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
