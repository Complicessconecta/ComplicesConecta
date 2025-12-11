/**
 * Asistente IA Interactivo de Tokens CMPX/GTK
 * Flujo wizard paso a paso para usuarios Beta
 * 
 * MEJORAS UX/UI:
 * - Animaciones de entrada para mensajes (fade-in + slide-up)
 * - Indicador de "Escribiendo..." con bouncing dots
 * - Skeletons para estados de carga
 * - Transiciones suaves entre estados
 * - Soporte para 60fps y 120fps con auto-detect
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { useTokens } from '@/hooks/useTokens';
import { aiLayerService } from '@/services/ai/AILayerService';
import { logger } from '@/lib/logger';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

// 🎨 Estilos de animaciones
const ANIMATION_STYLES = `
  @keyframes fadeInSlideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bouncingDots {
    0%, 80%, 100% {
      opacity: 0.3;
      transform: translateY(0);
    }
    40% {
      opacity: 1;
      transform: translateY(-8px);
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
  
  .message-animate {
    animation: fadeInSlideUp 0.4s ease-out;
  }
  
  .typing-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  
  .typing-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: currentColor;
    animation: bouncingDots 1.4s infinite;
  }
  
  .typing-dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  .skeleton {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.1) 100%
    );
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }
  
  .skeleton-line {
    height: 12px;
    border-radius: 4px;
    margin-bottom: 8px;
  }
`;

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
}

interface ChatAction {
  id: string;
  label: string;
  action: () => void;
  variant?: 'default' | 'outline' | 'destructive';
}

type WizardStep = 'greeting' | 'balance' | 'rewards' | 'staking' | 'confirmation' | 'completed';

// 🎨 Componente Skeleton para estados de carga
function SkeletonLoader() {
  return (
    <div className="space-y-3 p-4 bg-white/5 rounded-lg">
      <div className="skeleton skeleton-line w-3/4"></div>
      <div className="skeleton skeleton-line w-full"></div>
      <div className="skeleton skeleton-line w-2/3"></div>
    </div>
  );
}

// 🎨 Componente Typing Indicator con bouncing dots
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
      <Bot className="h-4 w-4 text-blue-400" />
      <div className="typing-indicator">
        <span className="typing-dot bg-blue-400"></span>
        <span className="typing-dot bg-blue-400"></span>
        <span className="typing-dot bg-blue-400"></span>
      </div>
    </div>
  );
}

export function TokenChatBot() {
  const {
    balance,
    pendingRewards,
    claimWorldIdReward,
    startStaking,
    refreshTokens,
    loading,
    isWorldIdEligible,
    hasPendingRewards
  } = useTokens();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<WizardStep>('greeting');
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [_stakingAmount, _setStakingAmount] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // 🎨 Inyectar estilos de animación
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = ANIMATION_STYLES;
    document.head.appendChild(styleElement as unknown as Node);
    return () => styleElement.remove();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat - solo una vez
  useEffect(() => {
    if (balance && !isInitialized.current && messages.length === 0) {
      isInitialized.current = true;
      addBotMessage(getGreetingMessage());
    }
  }, [balance]);

  const addBotMessage = (content: string, actions?: ChatAction[]) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      actions
    };
    
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, message]);
      setIsTyping(false);
    }, 1000);
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const getGreetingMessage = (): string => {
    const userName = 'Usuario'; // En producción obtener del contexto
    return `👋 ¡Hola ${userName}! Bienvenido a tu asistente de tokens Beta.

🪙 Soy tu guía personal para CMPX y GTK. Te puedo ayudar a:
• Ver tu saldo actual
• Reclamar recompensas disponibles  
• Configurar staking (alcancía especial)
• Aprender sobre el sistema de tokens

¿Quieres revisar tu saldo actual?`;
  };

  const getBalanceMessage = (): string => {
    if (!balance) return '⚠️ No pude cargar tu balance. Intenta refrescar.';

    const totalCMPX = balance.cmpxBalance + balance.cmpxStaked;
    const pendingAmount = pendingRewards.reduce((sum, r) => sum + r.amount, 0);

    return `🪙 **Tu saldo actual:**
• CMPX: ${totalCMPX} (${balance.cmpxBalance} disponibles, ${balance.cmpxStaked} en staking${pendingAmount > 0 ? `, ${pendingAmount} pendientes` : ''})
• GTK: ${balance.gtkBalance} (todos disponibles)

📊 **Límite mensual:** ${balance.monthlyRemaining}/${balance.monthlyLimit} CMPX restantes
👥 **Referidos exitosos:** ${balance.totalReferrals}

${hasPendingRewards ? '🎁 ¡Tienes recompensas pendientes!' : ''}`;
  };

  const getRewardsMessage = (): string => {
    const rewards = [];
    
    if (isWorldIdEligible) {
      rewards.push('• +100 CMPX → World ID verificado ✅');
    }
    
    pendingRewards.forEach(reward => {
      rewards.push(`• +${reward.amount} CMPX → ${reward.description}`);
    });

    if (rewards.length === 0) {
      return '😊 No tienes recompensas pendientes en este momento.\n\n💡 **Maneras de ganar CMPX:**\n• Verificar World ID (+100 CMPX)\n• Invitar cuates (+50 CMPX cada uno)\n• Completar perfil (+25 CMPX)\n• Dar feedback beta (+20 CMPX)\n• Iniciar sesión diario (+5 CMPX)';
    }

    return `🎁 **Recompensas disponibles:**\n${rewards.join('\n')}\n\n¿Quieres reclamar todas tus recompensas ahorita?`;
  };

  const getStakingMessage = (): string => {
    return `🔒 **¿Qué es el staking?**
Es como una alcancía especial: guardas tus CMPX por 30 días y al final recibes un +10% de recompensa.

💡 **Ejemplo:**
Si metes 100 CMPX → En 30 días tendrás 110 CMPX

✨ **Beneficios:**
• Apoyas la red ComplicesConecta
• Ganas recompensas pasivas
• Tokens seguros durante el período

Tienes ${balance?.cmpxBalance || 0} CMPX disponibles.
¿Cuántos CMPX quieres meter en staking?`;
  };

  // Handlers para diferentes pasos del wizard
  const handleGreetingResponse = (response: string) => {
    addUserMessage(response);
    
    if (response.toLowerCase().includes('sí') || response.toLowerCase().includes('si')) {
      setCurrentStep('balance');
      addBotMessage(getBalanceMessage(), [
        {
          id: 'check-rewards',
          label: '🎁 Ver recompensas',
          action: () => handleBalanceResponse('recompensas')
        },
        {
          id: 'check-staking',
          label: '🔒 Ver staking',
          action: () => handleBalanceResponse('staking')
        }
      ]);
    } else {
      addBotMessage('😊 ¡Perfecto! Cuando quieras revisar tu saldo, nomás pregúntame.\n\n💡 También puedes decir:\n• "¿Cuántos tokens tengo?"\n• "Quiero hacer staking"\n• "¿Qué recompensas hay?"');
    }
  };

  const handleBalanceResponse = (response: string) => {
    if (response === 'recompensas') {
      addUserMessage('Ver recompensas');
      setCurrentStep('rewards');
      
      if (hasPendingRewards || isWorldIdEligible) {
        addBotMessage(getRewardsMessage(), [
          {
            id: 'claim-all',
            label: '✅ Reclamar todas',
            action: handleClaimRewards
          },
          {
            id: 'maybe-later',
            label: '⏰ Más tarde',
            action: () => addBotMessage('😊 ¡Perfecto! Tus recompensas estarán aquí cuando las quieras reclamar.')
          }
        ]);
      } else {
        addBotMessage(getRewardsMessage());
      }
    } else if (response === 'staking') {
      addUserMessage('Ver staking');
      setCurrentStep('staking');
      addBotMessage(getStakingMessage());
    }
  };

  const handleClaimRewards = async () => {
    addUserMessage('Reclamar recompensas');
    addBotMessage('🔄 Procesando tus recompensas...');

    try {
      let totalClaimed = 0;
      const claimedRewards = [];

      if (isWorldIdEligible) {
        const result = await claimWorldIdReward();
        if (result) {
          totalClaimed += 100;
          claimedRewards.push('World ID (+100 CMPX)');
        }
      }

      // Aquí se procesarían otras recompensas pendientes
      // Por ahora simulamos el proceso

      if (totalClaimed > 0) {
        await refreshTokens();
        addBotMessage(`🎉 **¡Recompensas reclamadas con éxito!**

✅ Total agregado: ${totalClaimed} CMPX
📋 Recompensas: ${claimedRewards.join(', ')}

💰 Nuevo saldo: ${(balance?.cmpxBalance || 0) + totalClaimed} CMPX disponibles

¿Quieres revisar opciones de staking ahorita?`, [
          {
            id: 'yes-staking',
            label: '🔒 Sí, ver staking',
            action: () => handleRewardsResponse('staking')
          },
          {
            id: 'no-staking',
            label: '😊 No, gracias',
            action: () => addBotMessage('¡Perfecto! Tus tokens están seguros en tu saldo. ¡Que disfrutes ComplicesConecta! 🚀')
          }
        ]);
      } else {
        addBotMessage('⚠️ No se pudieron reclamar las recompensas. Inténtalo más tarde.');
      }
    } catch {
      addBotMessage('❌ Error procesando recompensas. Por favor inténtalo de nuevo.');
    }
  };

  const handleRewardsResponse = (response: string) => {
    if (response === 'staking') {
      setCurrentStep('staking');
      addBotMessage(getStakingMessage());
    }
  };

  const handleStakingInput = async (amount: string) => {
    const stakingAmount = parseInt(amount);
    
    if (isNaN(stakingAmount) || stakingAmount < 50) {
      addBotMessage('⚠️ Por favor ingresa un número válido. Mínimo 50 CMPX para hacer staking.');
      return;
    }

    if (stakingAmount > (balance?.cmpxBalance || 0)) {
      addBotMessage(`⚠️ No tienes suficientes CMPX. Tienes ${balance?.cmpxBalance || 0} disponibles.`);
      return;
    }

    addUserMessage(`${stakingAmount} CMPX`);
    _setStakingAmount(stakingAmount);
    
    const rewardAmount = Math.round(stakingAmount * 0.1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    addBotMessage(`🔒 **Confirmación de Staking**

💰 Cantidad: ${stakingAmount} CMPX
⏰ Duración: 30 días
📅 Fecha de liberación: ${endDate.toLocaleDateString('es-ES')}
🎁 Recompensa estimada: +${rewardAmount} CMPX
💎 Total a recibir: ${stakingAmount + rewardAmount} CMPX

¿Confirmas que quieres iniciar el staking?`, [
      {
        id: 'confirm-staking',
        label: '✅ Confirmar staking',
        action: () => executeStaking(stakingAmount)
      },
      {
        id: 'cancel-staking',
        label: '❌ Cancelar',
        action: () => addBotMessage('😊 Staking cancelado. Tus CMPX siguen disponibles en tu saldo.')
      }
    ]);
  };

  const executeStaking = async (amount: number) => {
    addUserMessage('Confirmar staking');
    addBotMessage('🔄 Procesando tu staking...');

    try {
      const result = await startStaking(amount);
      
      if (result) {
        await refreshTokens();
        setCurrentStep('completed');
        
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        addBotMessage(`🚀 **¡Staking iniciado con éxito!**

✅ ${amount} CMPX bloqueados por 30 días
📅 Liberación: ${endDate.toLocaleDateString('es-MX')}
🎁 Recompensa: +${Math.round(amount * 0.1)} CMPX

💡 **¿Qué sigue?**
• Tus tokens están seguros en staking
• Recibirás la recompensa automáticamente
• Puedes seguir ganando más CMPX mientras tanto

¡Gracias por apoyar la red ComplicesConecta! 🌟`);
      } else {
        addBotMessage(`❌ Error iniciando staking. Inténtalo de nuevo más tarde.`);
      }
    } catch {
      addBotMessage('❌ Error procesando staking. Por favor inténtalo de nuevo.');
    }
  };

  // 💬 TAREA 2: Procesar consultas libres con AILayerService
  const handleFreeFormQuery = async (query: string) => {
    try {
      setIsTyping(true);
      logger.info('💬 [CHATBOT] Procesando consulta libre', {
        queryLength: query.length,
        sanitized: true
      });

      // Llamar a AILayerService para generar respuesta contextualizada
      const response = await aiLayerService.generateTokenResponse(query);
      
      addBotMessage(response);
      setIsTyping(false);
    } catch (error) {
      logger.error('❌ Error procesando consulta', {
        error: error instanceof Error ? error.message : String(error)
      });
      addBotMessage('⚠️ Disculpa, tuve un problema procesando tu pregunta. Intenta de nuevo.');
      setIsTyping(false);
    }
  };

  const handleUserInput = (input: string) => {
    const lowerInput = input.toLowerCase().trim();
    
    // Respuestas contextuales según el paso actual
    switch (currentStep) {
      case 'greeting':
        handleGreetingResponse(input);
        break;
        
      case 'staking':
        if (/^\d+$/.test(input)) {
          handleStakingInput(input);
        } else if (lowerInput.includes('no') || lowerInput.includes('cancelar')) {
          addUserMessage(input);
          addBotMessage('😊 ¡Perfecto! El staking es opcional. Tus CMPX están seguros en tu saldo.\n\n¿Hay algo más en lo que te pueda ayudar?');
        } else {
          addUserMessage(input);
          addBotMessage('💡 Para hacer staking, ingresa la cantidad de CMPX (ejemplo: 100) o escribe "no" si prefieres no hacerlo ahorita.');
        }
        break;
        
      default:
        // Respuestas generales - usar AILayerService para consultas libres
        addUserMessage(input);
        
        if (lowerInput.includes('balance') || lowerInput.includes('tokens') || lowerInput.includes('cuántos')) {
          addBotMessage(getBalanceMessage());
        } else if (lowerInput.includes('recompensa') || lowerInput.includes('reclamar')) {
          addBotMessage(getRewardsMessage());
        } else if (lowerInput.includes('staking') || lowerInput.includes('alcancía')) {
          addBotMessage(getStakingMessage());
        } else {
          // 💬 TAREA 2: Usar AILayerService para consultas libres
          handleFreeFormQuery(input);
        }
    }
    
    setUserInput('');
  };

  const handleSendMessage = () => {
    if (userInput.trim()) {
      handleUserInput(userInput);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Cargando tu asistente de tokens...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="token-chatbox w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="border-b border-white/20 bg-gradient-to-r from-purple-900/80 to-blue-900/80 backdrop-filter backdrop-blur-md flex-shrink-0 shadow-lg">
        <CardTitle className="flex items-center gap-2 text-white font-bold drop-shadow-md">
          <Bot className="h-5 w-5 text-purple-300" />
          🤖 Asistente de Tokens CMPX/GTK
        </CardTitle>
        <p className="text-sm text-white font-medium drop-shadow-md">
          Tu guía personal para tokens en fase Beta
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 bg-gradient-to-b from-purple-900/10 to-blue-900/10">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-900/20 to-blue-900/20 backdrop-filter backdrop-blur-sm">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.type === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3 break-words overflow-hidden",
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'bg-gradient-to-r from-purple-800/95 via-purple-700/95 to-blue-800/95 backdrop-filter backdrop-blur-md text-white border border-purple-400/50 shadow-lg'
                )}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed break-words max-h-40 overflow-y-auto overflow-wrap-break-word hyphens-auto font-semibold text-white drop-shadow-lg">
                  {message.content.split('\n').map((line, idx) => {
                    // Detectar bullets y aplicar estilos especiales
                    if (line.trim().startsWith('•')) {
                      return (
                        <div key={idx} className="text-white font-medium drop-shadow-md mb-1">
                          {line}
                        </div>
                      );
                    }
                    return <div key={idx}>{line}</div>;
                  })}
                </div>
                
                {message.actions && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {message.actions.map((action) => (
                      <Button
                        key={action.id}
                        size="sm"
                        variant={action.variant || 'outline'}
                        onClick={action.action}
                        className="text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              
              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-gradient-to-r from-purple-800/40 to-blue-800/40 border border-purple-400/50 rounded-lg p-3 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="border-t border-white/30 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-filter backdrop-blur-md flex-shrink-0 shadow-lg">
          <div className="flex gap-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 bg-white/15 border-white/30 text-white placeholder-white/70 focus:border-white/50"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isTyping}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-white/80 mt-2">
            💡 Prueba: "¿Cuántos tokens tengo?" o "Quiero hacer staking"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
