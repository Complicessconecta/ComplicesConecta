import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Baby, Lock, Unlock, Shield, Clock } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import "@/styles/ParentalControl.css";
import { usePersistedState } from "@/hooks/usePersistedState";
import { toast } from "@/hooks/useToast";

interface ParentalControlProps {
  isLocked: boolean;
  onToggle: (locked: boolean) => void;
  onUnlock?: () => void;
  showLockScreen?: boolean;
}

type RestrictionLevel = "soft" | "medium" | "strict";

const LEVEL_DURATIONS: Record<RestrictionLevel, number> = {
  strict: 60,
  medium: 180,
  soft: 360,
};

function useLazyLockTimer(onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSecondsLeft(null);
  }, []);

  const start = useCallback(
    (duration: number) => {
      clear();
      setSecondsLeft(duration);
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === null) return prev;
          if (prev <= 1) {
            clear();
            onExpire();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clear, onExpire],
  );

  useEffect(() => () => clear(), [clear]);

  return { secondsLeft, start, clear };
}

export const ParentalControl = ({
  isLocked,
  onToggle,
  onUnlock,
  showLockScreen = true,
}: ParentalControlProps) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState("");
  const [savedPin] = usePersistedState("app_pin", "1234");
  const [restrictionLevel, setRestrictionLevel] =
    usePersistedState<RestrictionLevel>("restrictionLevel", "strict");
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { secondsLeft, start, clear } = useLazyLockTimer(() => {
    onToggle(true);
  });

  useEffect(() => {
    if (isLocked) {
      clear();
      setShowPinInput(false);
      setPin("");
      setAttempts(0);
      setLockoutUntil(null);
    }
  }, [isLocked, clear]);

  const countdownLabel = useMemo(() => {
    if (secondsLeft === null) return null;
    const minutes = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (secondsLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [secondsLeft]);

  const minutesForLevel = useMemo(() => {
    return Math.floor(LEVEL_DURATIONS[restrictionLevel] / 60);
  }, [restrictionLevel]);

  useEffect(() => {
    if (lockoutUntil) {
      const remaining = lockoutUntil - Date.now();
      if (remaining <= 0) {
        setLockoutUntil(null);
        setAttempts(0);
      } else {
        const timer = setTimeout(() => {
          setLockoutUntil(null);
          setAttempts(0);
        }, remaining);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [lockoutUntil]);

  const handlePinSubmit = () => {
    if (lockoutUntil && Date.now() < lockoutUntil) return;

    if (pin === savedPin) {
      onToggle(false);
      start(LEVEL_DURATIONS[restrictionLevel]);
      setShowPinInput(false);
      setPin("");
      setAttempts(0);
      if (onUnlock) onUnlock();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin("");

      if (newAttempts >= 3) {
        setLockoutUntil(Date.now() + 30000); // 30 seconds lockout
        toast({
          title: "Bloqueo temporal",
          description: "Demasiados intentos fallidos. Bloqueo por 30 segundos.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "PIN incorrecto",
          description: `Intentos restantes: ${3 - newAttempts}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && pin.length === 4) {
      handlePinSubmit();
    }
  };

  const handleRestrictionChange = (level: RestrictionLevel) => {
    setRestrictionLevel(level);
    if (secondsLeft !== null) {
      start(LEVEL_DURATIONS[level]);
    }
  };

  const restrictionGradient = (level: RestrictionLevel) => {
    switch (level) {
      case "soft":
        return "bg-linear-to-r from-green-500/20 to-emerald-500/20";
      case "medium":
        return "bg-linear-to-r from-yellow-500/20 to-orange-500/20";
      case "strict":
      default:
        return "bg-linear-to-r from-red-500/20 to-rose-500/20";
    }
  };

  if (isLocked && showLockScreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <Card className="w-full max-w-sm bg-linear-to-br from-purple-950 via-purple-900 to-blue-950 backdrop-blur-2xl border border-purple-500/30 shadow-2xl shadow-purple-900/50 rounded-3xl">
            <CardHeader className="text-center pb-4">
              <div
                className="mx-auto mb-4 p-3 rounded-full w-fit border-2 border-red-500/40 parental-control-icon"
              >
                <Baby className="h-6 w-6 text-red-400" />
              </div>
              <CardTitle className="text-lg font-bold text-white drop-shadow-lg">
                🔒 Control Parental
              </CardTitle>
              <p className="text-xs text-white/80 font-medium mt-1">
                Contenido restringido
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center">
                <Badge
                  className={cn(
                    restrictionGradient(restrictionLevel),
                    "text-white font-semibold px-3 py-1 text-xs backdrop-blur-sm border border-white/20",
                  )}
                >
                  {restrictionLevel.charAt(0).toUpperCase() +
                    restrictionLevel.slice(1)}
                </Badge>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <p className="text-xs text-center text-white/90 font-medium leading-relaxed">
                  🔞 Este contenido está restringido por control parental.
                  <br />
                  <span className="text-white/70">
                    Solo adultos pueden acceder.
                  </span>
                </p>
              </div>

              {!showPinInput ? (
                <Button
                  onClick={() => setShowPinInput(true)}
                  className="w-full text-white font-semibold py-3 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-300 hover:scale-105 bg-linear-to-r from-purple-600 to-blue-600"
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  🔓 Desbloquear
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <label className="block text-xs font-semibold mb-2 text-white/90 text-center">
                      🔢 Ingresa PIN:
                    </label>
                    <input
                      ref={inputRef}
                      type="password"
                      maxLength={4}
                      value={pin}
                      onChange={(e) =>
                        setPin(e.target.value.replace(/\D/g, ""))
                      }
                      onKeyDown={handleKeyDown}
                      disabled={!!(lockoutUntil && Date.now() < lockoutUntil)}
                      className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-center text-2xl tracking-widest text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 disabled:opacity-50"
                      placeholder="••••"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setShowPinInput(false);
                        setPin("");
                      }}
                      variant="outline"
                      className="flex-1 bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 rounded-xl py-2.5 text-xs font-semibold"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handlePinSubmit}
                      disabled={pin.length !== 4}
                      className={cn(
                        "flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all duration-300",
                        pin.length === 4
                          ? "bg-linear-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:scale-105"
                          : "bg-white/5 text-white/50 cursor-not-allowed backdrop-blur-sm border border-white/20",
                      )}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-[10px] text-center text-white/50 border-t border-white/10 pt-3">
                <p>🔒 Protección según Ley Olimpia</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isLocked && !showLockScreen) {
    return null;
  }

  // Panel de configuración cuando está desbloqueado
  return (
    <div
      className="w-full space-y-6 p-6 rounded-3xl shadow-2xl bg-white/5 backdrop-blur-sm border border-white/10"
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Control Parental</h3>
            <p className="text-sm text-zinc-400">
              Gestiona la seguridad y visibilidad
            </p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Activo
        </div>
      </div>

      {/* Temporizador de auto-bloqueo */}
      {countdownLabel && (
        <div className="flex items-center gap-2 text-sm text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/30">
          <Clock className="h-4 w-4" />
          <span>Auto-bloqueo en: {countdownLabel}</span>
        </div>
      )}

      {/* Barra de Nivel (Selector) */}
      <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-black/60 border border-white/10">
        {(["soft", "medium", "strict"] as const).map((level) => {
          const label =
            level === "medium"
              ? "Normal"
              : level.charAt(0).toUpperCase() + level.slice(1);
          const tooltipText =
            level === "soft"
              ? "Ligero: 360 segundos antes del siguiente bloqueo."
              : level === "strict"
                ? "Estricto: 60 segundos de ventana segura."
                : "Normal: 180 segundos balanceado.";

          return (
            <TooltipProvider key={level}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleRestrictionChange(level)}
                    className={cn(
                      "py-2 text-sm font-medium rounded-lg transition-all duration-300 w-full",
                      restrictionLevel === level
                        ? "bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-900/40 border border-white/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-white/5",
                    )}
                  >
                    {label}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs bg-black/80 border border-white/10 text-zinc-100">
                  {tooltipText}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Info del Nivel */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-purple-300 text-sm font-medium">
          <Clock className="w-4 h-4" />
          <span>Auto-bloqueo según nivel: {minutesForLevel} min</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Protección activa contra contenido sensible. Se requerirá PIN para
          acceder a galerías privadías.
        </p>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-400/60"
          onClick={() => {
            onToggle(true);
            clear();
          }}
        >
          <Lock className="w-4 h-4 mr-2" /> Bloquear Ahora
        </Button>
        <Button
          variant="outline"
          className="border-white/20 text-zinc-200 hover:bg-white/5"
          onClick={() =>
            toast({
              title: "Cambiar PIN",
              description: "Para cambiar el PIN, ve a Configuración > Seguridad.",
            })
          }
        >
          Cambiar PIN
        </Button>
      </div>

      {/* Descripción de niveles */}
      <div className="text-xs text-zinc-300 space-y-2 bg-black/40 rounded-xl p-4 border border-white/10">
        <div className="space-y-1">
          <p className="font-bold text-green-300">🟢 SUAVE (Básico):</p>
          <ul className="ml-4 space-y-0.5 text-zinc-300">
            <li>• Contenido sensible oculto con blur</li>
            <li>• NO hay auto-bloqueo automático</li>
            <li>• Perfecto para usuarios responsables</li>
          </ul>
        </div>

        <div className="space-y-1">
          <p className="font-bold text-amber-300">🟡 NORMAL (Recomendado):</p>
          <ul className="ml-4 space-y-0.5 text-zinc-300">
            <li>• Auto-bloqueo tras 180 segundos</li>
            <li>• Temporizador visible en pantalla</li>
            <li>• Balance entre seguridad y comodidad</li>
          </ul>
        </div>

        <div className="space-y-1">
          <p className="font-bold text-red-300">
            🔴 ESTRICTO (Máxima Seguridad):
          </p>
          <ul className="ml-4 space-y-0.5 text-zinc-300">
            <li>• Auto-bloqueo tras 5 min de inactividad</li>
            <li>• Requiere PIN para cada desbloqueo</li>
            <li>• NO permite bypass temporal</li>
            <li>• Máxima protección parental</li>
          </ul>
        </div>

        <p className="mt-2 pt-2 border-t border-white/10">
          <strong>📌 PIN actual:</strong>{" "}
          <span className="font-mono bg-white/10 px-2 py-0.5 rounded border border-white/20">
            {savedPin}
          </span>
          <br />
          <span className="text-zinc-500 text-[11px]">
            Click en "Cambiar PIN" para modificar
          </span>
        </p>
      </div>
    </div>
  );
};

