/**
 * Asistente IA Interactivo de Tokens CMPX/GTK
 * Flujo wizard paso a paso para usuarios Beta
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useTokens } from '@/hooks/useTokens';
import { Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
        // Respuestas generales
        addUserMessage(input);
        
        if (lowerInput.includes('balance') || lowerInput.includes('tokens') || lowerInput.includes('cuántos')) {
          addBotMessage(getBalanceMessage());
        } else if (lowerInput.includes('recompensa') || lowerInput.includes('reclamar')) {
          addBotMessage(getRewardsMessage());
        } else if (lowerInput.includes('staking') || lowerInput.includes('alcancía')) {
          addBotMessage(getStakingMessage());
        } else {
          addBotMessage('🤔 No estoy seguro de cómo ayudarte con eso.\n\n💡 **Me puedes preguntar:**\n• "¿Cuántos tokens tengo?"\n• "¿Qué recompensas hay?"\n• "¿Cómo funciona el staking?"\n• "Quiero reclamar recompensas"');
        }
    }
    
    setUserInput('');
  };

  const handleSendMessage = () => {
    if (userInput.trim()) {
      handleUserInput(userInput);
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-0">
        <div className="h-[500px] overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Messages Area */}
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'bot' ? 'justify-start' : 'justify-end'} mb-6`}
            >
              <div
                className={`p-4 rounded-2xl ${
                  message.type === 'bot'
                    ? 'bg-gray-800/80 text-gray-100 rounded-tl-none border-l-2 border-purple-500/50'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tr-none shadow-lg'
                } max-w-[85%]`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.actions && message.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {message.actions.map((action) => (
                      <motion.button
                        key={action.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.action}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                          action.variant === 'outline'
                            ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                            : action.variant === 'destructive'
                            ? 'bg-red-500/90 text-white hover:bg-red-600'
                            : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                        }`}
                      >
                        {action.label}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Input Area */}
          <div className="border-t border-purple-500/20 p-4 bg-gray-900/80 backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-gray-800/80 border border-purple-500/30 text-white placeholder-gray-400 rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isTyping}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!userInput.trim() || isTyping}
                className={`px-4 py-3 rounded-r-lg font-medium transition-all duration-200 ${
                  !userInput.trim() || isTyping
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg'
                }`}
              >
                {isTyping ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </motion.button>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">
              Presiona Enter para enviar
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
