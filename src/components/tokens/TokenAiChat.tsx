import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, User, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export const TokenAiChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "¡Hola! Soy tu asistente IA de Cómplices. ¿En qué puedo ayudarte hoy sobre tus tokens o NFTs?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI processing
    setTimeout(() => {
      const responseText = generateAiResponse(userMsg.text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAiResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes("balance") || q.includes("tengo") || q.includes("saldo")) {
      return "Actualmente tienes un balance combinado de CMPX y GTK. Puedes ver el desglose detallado en el panel superior de esta página.";
    }
    if (q.includes("nft") || q.includes("colección")) {
      return "Tu colección de NFTs está limitada a 4 espacios en esta versión beta. Los NFTs son generados aleatoriamente y tienen diferentes rarezas: Común, Raro, Épico y Legendario.";
    }
    if (q.includes("staking") || q.includes("invertir")) {
      // RONDA 28 (bloque O4): sin prometer APY — el staking llega con
      // la blockchain (próximamente) y no hay ningún APY vigente.
      return "El staking de GTK llegará próximamente, cuando se active la blockchain. Hoy no hay ningún rendimiento (APY) vigente: los niveles se anunciarán entonces.";
    }
    if (q.includes("cmpx") || q.includes("gtk")) {
      return "CMPX es nuestro token de uso diario dentro de la app. GTK es el token de blockchain para inversión y staking (próximamente). Ambos son parte del ecosistema Cómplices.";
    }
    if (q.includes("ayuda") || q.includes("opciones")) {
      return "Puedo ayudarte con información sobre: \n- Tu balance de tokens\n- Tu colección NFT\n- Cómo hacer staking\n- Para qué sirven los tokens CMPX y GTK";
    }
    return "Entiendo tu consulta. Para darte una respuesta precisa sobre tus activos digitales, te recomiendo revisar las secciones específicas del dashboard o contactar a soporte si tienes un problema técnico.";
  };

  return (
    <Card className="bg-white dark:bg-linear-to-br dark:from-indigo-900/40 dark:to-purple-900/40 backdrop-blur-md border-slate-200 dark:border-white/20 shadow-xl h-[500px] flex flex-col">
      <CardHeader className="border-b border-slate-200 dark:border-white/10 pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-lg">
          <Bot className="h-5 w-5 text-cyan-400" />
          Asistente Token IA
          <Badge
            variant="secondary"
            className="bg-cyan-500/15 text-cyan-700 text-[10px] ml-2 border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30"
          >
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
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                  msg.sender === "user"
                    ? "bg-linear-to-r from-purple-600 to-fuchsia-600 text-white rounded-tr-none shadow-lg shadow-purple-900/20"
                    : "bg-slate-900/5 text-slate-800 dark:bg-white/10 dark:text-white/90 rounded-tl-none border border-slate-200 dark:border-white/10"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 opacity-70 text-[10px] uppercase tracking-wider">
                  {msg.sender === "user" ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {msg.sender === "user" ? "Tú" : "AI Assistant"}
                </div>
                <div className="whitespace-pre-line leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-slate-900/5 dark:bg-white/10 rounded-2xl rounded-tl-none p-3 border border-slate-200 dark:border-white/10 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-500 dark:text-white/60">
                  Escribiendo...
                </span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2 items-end"
          >
            {/* Ronda 13 (stream A, A4): el <Input> de una línea
                truncaba el placeholder ("Pregunta sobre tus tokens
                o…") y el texto largo. Un <textarea> de 2 filas
                envuelve el placeholder y el mensaje; Enter envía,
                Shift+Enter salta de línea. */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Pregunta sobre tus tokens o NFTs..."
              rows={2}
              aria-label="Pregunta al asistente de tokens"
              className="flex w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-900/5 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-none"
            />
            <Button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl w-12 h-10 px-0 shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};
