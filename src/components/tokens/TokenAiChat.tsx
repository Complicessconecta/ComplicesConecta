import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/forms/Input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, User, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const TokenAiChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Â¡Hola! Soy tu asistente IA de CÃ³mplices. Â¿En quÃ© puedo ayudarte hoy sobre tus tokens o NFTs?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI processing
    setTimeout(() => {
      const responseText = generateAiResponse(userMsg.text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAiResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('balance') || q.includes('tengo') || q.includes('saldo')) {
      return 'Actualmente tienes un balance combinado de CMPX y GTK. Puedes ver el desglose detallado en el panel superior de esta pÃ¡gina.';
    }
    if (q.includes('nft') || q.includes('colecciÃ³n')) {
      return 'Tu colecciÃ³n de NFTs estÃ¡ limitada a 4 espacios en esta versiÃ³n beta. Los NFTs son generados aleatoriamente y tienen diferentes rarezas: ComÃºn, Raro, Ã‰pico y Legendario.';
    }
    if (q.includes('staking') || q.includes('invertir')) {
      return 'El Staking te permite bloquear tus tokens CMPX para ganar un rendimiento anual (APY). Revisa la secciÃ³n de "Staking" para ver las opciones disponibles.';
    }
    if (q.includes('cmpx') || q.includes('gtk')) {
      return 'CMPX es nuestro token de utilidad principal. GTK es el token de gobernanza. Ambos son esenciales para el ecosistema CÃ³mplices.';
    }
    if (q.includes('ayuda') || q.includes('opciones')) {
      return 'Puedo ayudarte con informaciÃ³n sobre: \n- Tu balance de tokens\n- Tu colecciÃ³n NFT\n- CÃ³mo hacer staking\n- Para quÃ© sirven los tokens CMPX y GTK';
    }
    return 'Entiendo tu consulta. Para darte una respuesta precisa sobre tus activos digitales, te recomiendo revisar las secciones especÃ­ficas del dashboard o contactar a soporte si tienes un problema tÃ©cnico.';
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-md border-white/20 shadow-xl h-[500px] flex flex-col">
      <CardHeader className="border-b border-white/10 pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <Bot className="h-5 w-5 text-cyan-400" />
          Asistente Token IA
          <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 text-[10px] ml-2 border-cyan-500/30">
            BETA
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none shadow-lg shadow-purple-900/20' 
                    : 'bg-white/10 text-white/90 rounded-tl-none border border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 opacity-70 text-[10px] uppercase tracking-wider">
                  {msg.sender === 'user' ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  {msg.sender === 'user' ? 'TÃº' : 'AI Assistant'}
                </div>
                <div className="whitespace-pre-line leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/10 rounded-2xl rounded-tl-none p-3 border border-white/10 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-xs text-white/60">Escribiendo...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/20 border-t border-white/10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex gap-2"
          >
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pregunta sobre tus tokens o NFTs..."
              className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-cyan-500/50 focus:border-cyan-500/50 rounded-xl"
            />
            <Button 
              type="submit" 
              disabled={!inputText.trim() || isTyping}
              className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl w-12 px-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};


