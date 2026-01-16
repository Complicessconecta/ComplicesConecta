import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { ArrowLeft, Scale, Sparkles } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import { TokensSubnav } from "@/components/TokensSubnav";

export default function TokensLegal() {
  const navigate = useNavigate();
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    fetch("/docs/legal/TOKENS_LEGAL.md")
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      <TokensSubnav />
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-900/80 via-purple-800/80 to-blue-900/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate("/tokens")}
              className="text-white hover:bg-white/10 btn-accessible bg-transparent border-none"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="truncate">Regresar</span>
            </Button>

            <h1 className="text-xl font-bold text-white">
              Responsabilidad Legal - Tokens
            </h1>

            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Responsabilidad Legal
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Sistema de Tokens CMPX/GTK
            </span>
          </h1>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border border-primary/10">
          <CardHeader>
            <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
              <Scale className="h-4 w-4 text-purple-300" />
              Marco Legal de Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none p-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {markdown}
            </ReactMarkdown>
          </CardContent>
        </Card>

        {/* CTA hacia el Centro de Control de IA */}
        <Card className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl">
          <CardHeader className="pb-3 flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              ¿Dudas sobre estos términos?
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs md:text-sm text-white/80">
            <p className="max-w-xl">
              Puedes visitar el{" "}
              <span className="font-semibold text-white">
                Centro de Control de IA
              </span>{" "}
              para hacer preguntas en lenguaje sencillo sobre estos documentos,
              tu contrato digital o el funcionamiento de los tokens CMPX/GTK.
            </p>
            <Link to="/ai-help" className="inline-flex">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm">
                <Sparkles className="w-4 h-4" />
                Ir al Centro de Control IA
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
