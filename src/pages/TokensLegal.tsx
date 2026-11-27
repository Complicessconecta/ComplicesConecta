import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { ArrowLeft, Scale, Sparkles, AlertTriangle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import { TokensSubnav } from "@/components/TokensSubnav";

export default function TokensLegal() {
  const navigate = useNavigate();
  const [markdown, setMarkdown] = useState("");
  // Antes el fetch no checaba response.ok: como TOKENS_LEGAL.md no
  // existía en public/docs/legal/, el SPA devolvía index.html con 200 y
  // el componente renderizaba ese HTML como texto visible. Ahora el doc
  // sí está sincronizado, pero si vuelve a faltar (o el servidor devuelve
  // el fallback HTML) se muestra un error legible en vez del código.
  // Sin rehypeRaw a propósito: el .md no trae HTML y así un fallback
  // HTML nunca se renderiza como marcado ni ejecuta scripts.
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError("");
    fetch("/docs/legal/TOKENS_LEGAL.md")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Documento no disponible (HTTP ${response.status})`);
        }
        const contentType = response.headers.get("content-type") ?? "";
        const text = await response.text();
        // El fallback del SPA devuelve index.html con 200: detectarlo
        // por content-type y por contenido, no solo por el status.
        if (
          contentType.includes("text/html") ||
          text.trimStart().startsWith("<!DOCTYPE") ||
          text.trimStart().startsWith("<html")
        ) {
          throw new Error(
            "Documento no disponible: el servidor devolvió la página principal en lugar del documento legal.",
          );
        }
        return text;
      })
      .then((text) => {
        if (!cancelled) {
          setMarkdown(text);
          setIsLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar el documento legal.",
          );
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-blue-900">
      <TokensSubnav />
      {/* Header: el título llevaba `truncate` y entre el botón Regresar
          y el espaciador w-20 no cabía en móvil ("Responsabilid...").
          Ahora el título ocupa su propia línea en móvil y no se trunca. */}
      <div className="sticky top-0 z-50 bg-linear-to-r from-purple-900/80 via-purple-800/80 to-blue-900/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <Button
              onClick={() => navigate("/tokens")}
              className="shrink-0 whitespace-nowrap text-white hover:bg-white/10 btn-accessible bg-transparent border-none"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="truncate">Regresar</span>
            </Button>

            <h1 className="order-3 w-full text-center text-sm font-bold text-white leading-tight sm:order-none sm:w-auto sm:min-w-0 sm:flex-1 sm:text-xl">
              Responsabilidad Legal - Tokens
            </h1>

            <div className="hidden w-20 shrink-0 sm:block"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-purple-600 to-blue-600 rounded-full mb-4">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Responsabilidad Legal
            <span className="block text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-blue-400">
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
            {isLoading ? (
              <p className="text-white/80">Cargando documento legal…</p>
            ) : loadError ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 not-prose">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" />
                <div>
                  <p className="font-semibold text-amber-200">
                    No se pudo cargar el documento legal
                  </p>
                  <p className="text-sm text-white/80">{loadError}</p>
                  <p className="mt-2 text-sm text-white/80">
                    Puedes consultar los términos de tokens en la{" "}
                    <Link to="/tokens-terms" className="underline text-white">
                      página de Términos de Tokens
                    </Link>{" "}
                    o escribir a tokens@complicesconecta.com.
                  </p>
                </div>
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            )}
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
              <Button className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm">
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
