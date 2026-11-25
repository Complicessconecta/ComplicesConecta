import React, { useState, useEffect, useCallback } from "react";
import { Check, X, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

// Configuración de Supabase
// Usar el cliente singleton compartido para evitar múltiples instancias en HMR

interface NicknameValidatorProps {
  value: string;
  onChange: (value: string) => void;
  /**
   * (isValid, isAvailable, checkStatus).
   * - isValid: el FORMATO es válido (3–20 caracteres, [a-zA-Z0-9_-]).
   * - isAvailable: se puede continuar con este apodo.
   * - checkStatus: "available" (servidor lo confirmó libre),
   *   "taken" (servidor o lista local dice que está usado),
   *   "unverified" (el servidor NO pudo verificar: formato válido y no
   *   reservado, se permite continuar para no bloquear el registro;
   *   la confirmación definitiva es la RPC cuando la migración
   *   20261124050001 esté aplicada) o "invalid" (formato no válido).
   * El tercer parámetro es opcional: los formularios que solo miran
   * (isValid, isAvailable) siguen funcionando igual.
   */
  onValidationChange: (
    isValid: boolean,
    isAvailable: boolean,
    checkStatus?: "available" | "taken" | "unverified" | "invalid",
  ) => void;
  className?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

type NicknameCheckStatus =
  "idle" | "checking" | "available" | "taken" | "unverified" | "invalid";

interface ValidationState {
  isChecking: boolean;
  isValid: boolean;
  isAvailable: boolean;
  /** De dónde salió el veredicto (ver onValidationChange). */
  checkStatus: NicknameCheckStatus;
  message: string;
  suggestions: string[];
}

/**
 * Apodos reservados del sistema / demo: no se pueden registrar aunque
 * el servidor no responda. Los nombres de los perfiles demo (Ana,
 * Carlos, …) no hace falta listarlos: llevan espacios o "&" y el
 * formato ya los rechaza.
 */
const RESERVED_NICKNAMES = new Set([
  "admin",
  "administrador",
  "moderador",
  "soporte",
  "support",
  "demo",
  "demouser",
  "sistema",
  "system",
  "complicesconecta",
  "root",
]);

const isReservedNickname = (nickname: string): boolean =>
  RESERVED_NICKNAMES.has(nickname.trim().toLowerCase());

export const NicknameValidator: React.FC<NicknameValidatorProps> = ({
  value,
  onChange,
  onValidationChange,
  className = "",
  label = "Apodo/Nickname *",
  placeholder = "Tu apodo único",
  required = true,
}) => {
  const [validation, setValidation] = useState<ValidationState>({
    isChecking: false,
    isValid: false,
    isAvailable: false,
    checkStatus: "idle",
    message: "",
    suggestions: [],
  });

  // Validar formato del nickname
  const validateFormat = (
    nickname: string,
  ): { isValid: boolean; message: string } => {
    if (!nickname.trim()) {
      return { isValid: false, message: "El apodo es obligatorio" };
    }

    if (nickname.length < 3) {
      return {
        isValid: false,
        message: "El apodo debe tener al menos 3 caracteres",
      };
    }

    if (nickname.length > 20) {
      return {
        isValid: false,
        message: "El apodo no puede tener más de 20 caracteres",
      };
    }

    // Solo letras, números, guiones y guiones bajos
    if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
      return {
        isValid: false,
        message: "Solo se permiten letras, números, guiones y guiones bajos",
      };
    }

    // No puede empezar o terminar con guión o guión bajo
    if (/^[-_]|[-_]$/.test(nickname)) {
      return {
        isValid: false,
        message: "No puede empezar o terminar con guión o guión bajo",
      };
    }

    return { isValid: true, message: "Formato válido" };
  };

  // Generar sugerencias de apodos alternativos
  const generateSuggestions = (baseNickname: string): string[] => {
    const base = baseNickname.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    const suggestions = [
      `${base}_01`,
      `${base}_mx`,
      `${base}123`,
      `${base}_sw`,
      `${base}_2024`,
      `${base}_cc`,
    ];

    return suggestions.slice(0, 3); // Solo mostrar 3 sugerencias
  };

  // Verificar disponibilidad en base de datos.
  //
  // Camino del error que bloqueaba el registro (test 2026-11-24):
  //  1. La RPC `check_nickname_available` NO existe en producción
  //     (migración 20261124050001 sin aplicar) -> PostgREST PGRST202.
  //  2. El respaldo (consulta directa a profiles.nickname) también
  //     falla: la columna tampoco existe en producción (error 42703)
  //     y, aunque existiera, RLS exige sesión y en registro aún no
  //     hay (anon no lee profiles).
  //  3. El catch anterior marcaba isAvailable=false con CUALQUIER
  //     error, y ambos formularios exigen isValid && isAvailable
  //     para "Continuar" -> registro bloqueado con cualquier apodo.
  //
  // Orden de resolución (la primera que responde manda):
  //  a. RPC pública (migración 20261124050001 aplicada): veredicto
  //     definitivo del servidor, salta RLS (SECURITY DEFINER).
  //  b. Consulta directa (solo donde RLS lo permite: local/dev).
  //  c. Si el servidor NO responde (migración sin aplicar, RLS o
  //     red): NO se bloquea. Se valida formato + lista local de
  //     reservados y se marca "unverified": el formulario permite
  //     continuar y el mensaje lo dice con honestidad (ámbar, no
  //     verde). La unicidad definitiva la da el servidor cuando la
  //     migración esté aplicada (RPC + índice único 20261124050002);
  //     hasta entonces un duplicado es posible pero el registro ya
  //     no queda bloqueado, que es el bloqueador mayor del test.
  const checkAvailability = useCallback(
    async (nickname: string) => {
      if (!nickname.trim()) return;

      const formatValidation = validateFormat(nickname);
      if (!formatValidation.isValid) {
        setValidation((prev) => ({
          ...prev,
          isChecking: false,
          isValid: false,
          isAvailable: false,
          checkStatus: "invalid",
          message: formatValidation.message,
          suggestions: [],
        }));
        onValidationChange(false, false, "invalid");
        return;
      }

      setValidation((prev) => ({
        ...prev,
        isChecking: true,
        checkStatus: "checking",
      }));

      const reportAvailable = (available: boolean) => {
        if (available) {
          setValidation((prev) => ({
            ...prev,
            isChecking: false,
            isValid: true,
            isAvailable: true,
            checkStatus: "available",
            message: "✅ Apodo disponible",
            suggestions: [],
          }));
          onValidationChange(true, true, "available");
        } else {
          const suggestions = generateSuggestions(nickname);
          setValidation((prev) => ({
            ...prev,
            isChecking: false,
            isValid: true,
            isAvailable: false,
            checkStatus: "taken",
            message: "❌ Este apodo ya está en uso",
            suggestions,
          }));
          onValidationChange(true, false, "taken");
        }
      };

      // (c) Veredicto provisional sin servidor: formato válido y no
      // reservado -> se permite continuar, marcado como no verificado.
      const reportUnverified = () => {
        if (isReservedNickname(nickname)) {
          const suggestions = generateSuggestions(nickname);
          setValidation((prev) => ({
            ...prev,
            isChecking: false,
            isValid: true,
            isAvailable: false,
            checkStatus: "taken",
            message: "❌ Este apodo está reservado",
            suggestions,
          }));
          onValidationChange(true, false, "taken");
          return;
        }
        setValidation((prev) => ({
          ...prev,
          isChecking: false,
          isValid: true,
          isAvailable: true,
          checkStatus: "unverified",
          message:
            "⚠️ No se pudo verificar en el servidor (migración pendiente): formato válido y no reservado. Puedes continuar; la disponibilidad definitiva se confirma cuando la verificación del servidor esté activa.",
          suggestions: [],
        }));
        onValidationChange(true, true, "unverified");
      };

      try {
        // (a) Disponibilidad vía RPC pública check_nickname_available
        // (migración 20261124050001). SECURITY DEFINER (salta RLS) y
        // solo devuelve un booleano.
        // Sin tipos generados aún para la RPC: cast a any hasta que el
        // coordinador agregue su firma a supabase-generated.ts.
        const { data: rpcAvailable, error: rpcError } = await (
          supabase as any
        ).rpc("check_nickname_available", {
          p_nickname: nickname.trim(),
        });

        if (!rpcError && typeof rpcAvailable === "boolean") {
          reportAvailable(rpcAvailable);
          return;
        }

        // (b) Respaldo a la consulta directa, que funciona donde RLS
        // lo permite (local/dev). CUALQUIER error de la RPC (función
        // inexistente PGRST202/42883, RLS, red) cae aquí; si la
        // consulta directa también falla, se pasa al veredicto
        // provisional (c) en vez de bloquear el registro.
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("nickname")
            .ilike("nickname", nickname.trim())
            .limit(1);
          if (error) throw error;
          reportAvailable(!data || data.length === 0);
        } catch (directError) {
          console.warn(
            "Nickname check sin servidor (RPC y consulta directa fallaron); se permite continuar con verificación provisional:",
            rpcError ?? directError,
          );
          reportUnverified();
        }
      } catch (error) {
        // Ni siquiera se pudo intentar la verificación (p. ej. el
        // cliente Supabase no responde): mismo veredicto provisional,
        // nunca bloquear el registro por un fallo de red/servidor.
        console.warn(
          "Nickname check: error inesperado, verificación provisional:",
          error,
        );
        reportUnverified();
      }
    },
    [onValidationChange],
  );

  // Debounce para evitar muchas consultas
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.trim()) {
        checkAvailability(value.trim());
      } else {
        setValidation({
          isChecking: false,
          isValid: false,
          isAvailable: false,
          checkStatus: "idle",
          message: "",
          suggestions: [],
        });
        onValidationChange(false, false, "invalid");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, checkAvailability, onValidationChange]);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
  };

  const getInputBorderColor = () => {
    if (!value.trim()) return "border-white/20";
    if (validation.isChecking) return "border-yellow-400";
    if (validation.checkStatus === "available") return "border-green-400";
    // Sin verificación del servidor: ámbar (advertencia, no error).
    if (validation.checkStatus === "unverified") return "border-amber-400";
    if (!validation.isValid || !validation.isAvailable) return "border-red-400";
    return "border-white/20";
  };

  const getMessageColor = () => {
    if (validation.checkStatus === "available") return "text-green-400";
    if (validation.checkStatus === "unverified") return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className={className}>
      <Label className="text-white">{label}</Label>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`bg-white/10 text-white placeholder:text-white/50 ${getInputBorderColor()}`}
          placeholder={placeholder}
          required={required}
        />

        {/* Indicador de estado */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {validation.isChecking && (
            <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
          )}
          {!validation.isChecking && validation.checkStatus === "available" && (
            <Check className="h-4 w-4 text-green-400" />
          )}
          {!validation.isChecking &&
            (validation.checkStatus === "taken" ||
              validation.checkStatus === "invalid") &&
            value.trim() && <X className="h-4 w-4 text-red-400" />}
        </div>
      </div>

      {/* Mensaje de validación */}
      {validation.message && (
        <div className={`mt-2 text-sm ${getMessageColor()}`}>
          {validation.message}
        </div>
      )}

      {/* Sugerencias */}
      {validation.suggestions.length > 0 && (
        <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="text-sm text-white/80 mb-2">
            Prueba con estas alternativas:
          </div>
          <div className="flex flex-wrap gap-2">
            {validation.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
