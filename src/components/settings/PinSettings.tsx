import React, { useState } from "react";
import { KeyRound, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Button } from "@/components/ui/buttons/Button";

export const PinSettings: React.FC = () => {
  const { toast } = useToast();
  const [storedPin, setStoredPin] = usePersistedState<string>("app_pin", "");
  const [pinCreatedAt, setPinCreatedAt] = usePersistedState<number>("pin_created_at", Date.now());
  const [pinExpiresAt, setPinExpiresAt] = usePersistedState<number>("pin_expires_at", Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 días
  const [mustChangePin, setMustChangePin] = usePersistedState<boolean>("must_change_pin", import.meta.env.PROD);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const hasPin = !!storedPin;

  // Validar expiración y forzar cambio en producción si es PIN default
  const isExpired = Date.now() > pinExpiresAt;
  const isDefaultPin = storedPin === "1234";
  const shouldForceChange = import.meta.env.PROD && (isExpired || isDefaultPin || mustChangePin);

  const handleSetPin = () => {
    if (newPin.length !== 4) {
      toast({
        title: "Error",
        description: "El PIN debe tener 4 dígitos",
        variant: "destructive",
      });
      return;
    }
    if (newPin !== confirmPin) {
      toast({
        title: "Error",
        description: "Los PINs no coinciden",
        variant: "destructive",
      });
      return;
    }

    setStoredPin(newPin);
    setPinCreatedAt(Date.now());
    setPinExpiresAt(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 días
    setMustChangePin(false);
    setIsSettingPin(false);
    setNewPin("");
    setConfirmPin("");
    setCurrentPin("");
    toast({ title: "Éxito", description: "PIN configurado correctamente" });
  };

  const handleChangePin = () => {
    if (currentPin !== storedPin) {
      toast({
        title: "Error",
        description: "PIN actual incorrecto",
        variant: "destructive",
      });
      return;
    }
    handleSetPin();
  };

  const handleRemovePin = () => {
    if (currentPin !== storedPin) {
      toast({
        title: "Error",
        description: "Ingresa tu PIN actual para eliminarlo",
        variant: "destructive",
      });
      return;
    }
    setStoredPin("");
    setPinCreatedAt(0);
    setPinExpiresAt(0);
    setMustChangePin(false);
    setIsSettingPin(false);
    setCurrentPin("");
    toast({ title: "Éxito", description: "PIN eliminado" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <KeyRound className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            PIN de Seguridad
          </h3>
          <p className="text-sm text-gray-600">
            Configura un PIN de 4 dígitos para acceso rápido y seguridad
            adicional
          </p>
        </div>
      </div>

      <div
        className={`p-4 rounded-lg border ${
          hasPin && !shouldForceChange
            ? "bg-green-50 border-green-200"
            : shouldForceChange
              ? "bg-red-50 border-red-200"
              : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {hasPin && !shouldForceChange ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : shouldForceChange ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-gray-400" />
            )}
            <span
              className={`font-medium ${
                hasPin && !shouldForceChange
                  ? "text-green-800"
                  : shouldForceChange
                    ? "text-red-800"
                    : "text-gray-700"
              }`}
            >
              {hasPin && !shouldForceChange
                ? "PIN Configurado"
                : shouldForceChange
                  ? "PIN Requerido (expirado/default)"
                  : "Sin PIN configurado"}
            </span>
          </div>

          {(!isSettingPin || shouldForceChange) && (
            <Button
              variant={hasPin && !shouldForceChange ? "outline" : "default"}
              size="sm"
              onClick={() => setIsSettingPin(true)}
            >
              {hasPin && !shouldForceChange ? "Cambiar PIN" : "Configurar PIN"}
            </Button>
          )}
        </div>

        {isSettingPin && (
          <div className="space-y-4 mt-4 border-t border-gray-200 pt-4 animate-in slide-in-from-top-2">
            {hasPin && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  PIN Actual
                </label>
                <input
                  type="password"
                  maxLength={4}
                  className="w-full p-2 border rounded-md bg-white text-center text-2xl tracking-widest"
                  value={currentPin}
                  onChange={(e) =>
                    setCurrentPin(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="••••"
                  autoFocus
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nuevo PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  className="w-full p-2 border rounded-md bg-white text-center text-2xl tracking-widest"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Confirmar PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  className="w-full p-2 border rounded-md bg-white text-center text-2xl tracking-widest"
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="••••"
                />
              </div>
            </div>

            {shouldForceChange && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Debes establecer un PIN de 4 dígitos para continuar.
                  {isExpired && " Tu PIN anterior ha expirado."}
                  {isDefaultPin && " No puedes usar el PIN por defecto."}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsSettingPin(false);
                  setNewPin("");
                  setConfirmPin("");
                  setCurrentPin("");
                }}
              >
                Cancelar
              </Button>

              {hasPin && (
                <Button
                  variant="destructive"
                  onClick={handleRemovePin}
                  disabled={currentPin.length !== 4}
                >
                  Eliminar PIN
                </Button>
              )}

              <Button
                onClick={hasPin ? handleChangePin : handleSetPin}
                disabled={
                  newPin.length !== 4 ||
                  confirmPin.length !== 4 ||
                  (hasPin && currentPin.length !== 4)
                }
              >
                Guardar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Información de seguridad */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Seguridad del PIN
        </h4>
        <ul className="text-sm text-gray-600 space-y-1 ml-6 list-disc">
          <li>El PIN se almacena solo en este dispositivo.</li>
          <li>
            Úsalo para desbloquear contenido sensible y confirmar acciones.
          </li>
          <li>
            Si olvidías tu PIN, tendrás que restablecerlo autenticándote
            nuevamente.
          </li>
        </ul>
      </div>
    </div>
  );
};

