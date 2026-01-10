import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Bot, Shield, BookOpen, ArrowRight } from "lucide-react";
import { LegalChatBox } from "@/components/ai/LegalChatBox";

const AIControlCenter: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 md:space-y-12">
        {/* Hero principal */}
        <header className="text-center space-y-4 md:space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl shadow-2xl shadow-purple-500/50 border border-white/20">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Centro de Control de IA
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-300 mt-1">
                Tu asistente legal y operativo en CómplicesConecta
              </span>
            </h1>
            <p className="text-sm md:text-base text-white/75 max-w-2xl mx-auto">
              Aquí puedes hablar con la IA Local de CómplicesConecta, entender
              cómo funciona la seguridad forense de tus tokens y contratos, y
              resolver dudas antes de firmar o invertir.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            <Badge className="bg-white/10 border-white/20 text-white text-[10px] uppercase tracking-wide">
              IA Local · WebLLM · Phi-3-mini
            </Badge>
            <Badge className="bg-emerald-500/20 border-emerald-400/40 text-emerald-200 text-[10px] uppercase tracking-wide">
              Sin enviar datos a la nube
            </Badge>
          </div>
        </header>

        {/* Bloques informativos */}
        <section className="grid md:grid-cols-3 gap-4 md:gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <BookOpen className="w-4 h-4 text-purple-300" />
                ¿Qué es Cómplices Conecta?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs md:text-sm text-white/80 space-y-2">
              <p>
                Es una plataforma social privada para parejas, solteros y
                comunidades lifestyle en México, con enfoque en discreción,
                seguridad y control total de tus datos.
              </p>
              <p>
                Tus interacciones, tokens y NFTs están protegidos por un sistema
                de contratos digitales y evidencias forenses pensadas para
                evitar abusos y fraudes.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <Shield className="w-4 h-4 text-cyan-300" />
                ¿Por qué la IA es local y segura?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs md:text-sm text-white/80 space-y-2">
              <p>
                La IA se ejecuta directamente en tu navegador usando WebLLM y el
                modelo Phi-3-mini. Eso significa que tus preguntas y contexto no
                se envían a servidores externos.
              </p>
              <p>
                El modelo se descarga una sola vez, y el progreso se muestra
                visualmente. Ideal para explicar cláusulas sensibles como la
                Muerte Súbita o el congelamiento de activos.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <Bot className="w-4 h-4 text-emerald-300" />
                Guía rápida de registro
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs md:text-sm text-white/80 space-y-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>Crea tu cuenta con correo seguro.</li>
                <li>
                  Completa tu perfil (single o pareja) y verifica tu identidad
                  si aplica.
                </li>
                <li>
                  Activa tu contrato digital de pareja antes de usar NFTs o
                  Staking.
                </li>
                <li>
                  Visita esta página cuando tengas dudas legales u operativas.
                </li>
              </ol>
              <p className="flex items-center gap-1 text-[11px] text-white/70">
                <ArrowRight className="w-3 h-3" />
                La IA puede explicarte cada paso en lenguaje sencillo.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Asistente Legal Maestro - protagonista */}
        <section className="space-y-4 md:space-y-6">
          <Card className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.45)]">
            <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Bot className="h-5 w-5 text-cyan-300" />
                  Asistente IA de Cómplices
                </CardTitle>
                <p className="text-xs md:text-sm text-white/75 max-w-xl">
                  Pregunta lo que necesites sobre contratos, tokens, seguridad o
                  cómo empezar. La IA combinará el Libro Maestro Legal con tu
                  contexto para darte respuestas claras.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/40 text-[10px]">
                  Ley de Servicios de Confianza &amp; Firma Electrónica
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-200 border-purple-400/40 text-[10px]">
                  Seguridad Forense (IP · Hash · Timestamp)
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <LegalChatBox />
            </CardContent>
          </Card>
        </section>

        {/* Footer pequeño explicativo */}
        <footer className="pt-4 pb-8 text-center text-[11px] text-white/60">
          Esta IA no sustituye asesoría legal profesional, pero te ayuda a
          entender cómo funcionan tus contratos y activos dentro de
          CómplicesConecta.
        </footer>
      </div>
    </div>
  );
};

export default AIControlCenter;
