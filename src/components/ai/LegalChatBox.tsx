import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Input } from "@/components/ui/forms/Input";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Bot, Shield, Loader2 } from "lucide-react";
import { useLocalAI } from "@/ai/useLocalAI";
import type { RelationshipStatus } from "@/ai/AIWorker";
import "@/styles/LegalChatBox.css";

interface LegalChatBoxProps {
  hasActivePrenup?: boolean;
  relationshipStatus?: RelationshipStatus;
}

export const LegalChatBox: React.FC<LegalChatBoxProps> = ({
  hasActivePrenup,
  relationshipStatus,
}) => {
  const [input, setInput] = useState("");

  const { messages, progress, isReady, sendMessage } = useLocalAI({
    initialRuntimeState:
      hasActivePrenup !== undefined && relationshipStatus
        ? { hasActivePrenup, relationshipStatus }
        : undefined,
  } as any);

  const handleSend = async () => {
    if (!input.trim()) return;

    await sendMessage(input.trim(), {
      hasActivePrenup: hasActivePrenup ?? false,
      relationshipStatus: relationshipStatus ?? "ACTIVE",
    });

    setInput("");
  };

  const isLoadingModel =
    progress.stage !== "ready" && progress.stage !== "error";

  return (
    <Card className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl">
      <CardHeader className="pb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
            <Bot className="h-5 w-5 text-cyan-400" />
            Auditor Legal de Tokens
            <Badge className="ml-2 bg-cyan-500/20 text-cyan-200 border-cyan-400/40 text-[10px] uppercase tracking-wide">
              IA Local
            </Badge>
          </CardTitle>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/60">
            <Shield className="h-3 w-3 text-emerald-300" />
            <span>
              Estado:{" "}
              {hasActivePrenup
                ? relationshipStatus === "FROZEN_DISPUTE"
                  ? "Disputa activa (activos congelados)"
                  : relationshipStatus === "DISSOLVED"
                    ? "Relación disuelta"
                    : "Contrato activo"
                : "Sin contrato activo"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-white/70">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-1 bg-linear-to-r from-purple-500 via-blue-500 to-cyan-500 transition-all duration-300 progress-bar-fill ${
                isLoadingModel ? "animate-pulse" : ""
              }`}
              style={{ width: `${progress.percent || (isReady ? 100 : 10)}%` }}
            />
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px]">
            {progress.message ||
              (isReady
                ? "Modelo local listo"
                : progress.stage === "error"
                  ? "Error de modelo"
                  : "Inicializando modelo local...")}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <p className="text-xs text-white/70">
          Pregunta cosas como:{" "}
          <span className="text-white/90">
            "¿Por qué mis activos están congelados?", "¿Por qué no puedo comprar
            NFTs?", "¿Qué validez tiene mi firma?".
          </span>
        </p>

        <div className="max-h-72 overflow-y-auto space-y-2 text-sm text-white/90 bg-black/30 rounded-xl border border-white/10 p-3">
          {messages.length === 0 && (
            <p className="text-xs text-white/60">
              Este asistente usa tu estado legal real (contrato activo, disputas
              y evidencias) para explicarte por qué ciertas acciones están
              bloqueadas.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "user" ? "text-right" : "text-left"}
            >
              <span
                className={
                  m.role === "user"
                    ? "inline-block bg-purple-600/70 px-3 py-1.5 rounded-2xl shadow-md max-w-full text-left"
                    : "inline-block bg-white/10 px-3 py-1.5 rounded-2xl border border-white/15 max-w-full text-left"
                }
              >
                {m.content}
              </span>
            </div>
          ))}
        </div>

        <form
          className="flex gap-2 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu duda legal u operativa..."
            className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
          />
          <Button
            type="submit"
            disabled={!input.trim()}
            className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4"
          >
            {isLoadingModel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Enviar"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
