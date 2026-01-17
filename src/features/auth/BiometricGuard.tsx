import { useState, useEffect } from "react";
import type { FC, ReactNode } from "react";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import { PinInput } from "@/features/auth/PinInput";
import { Shield, Lock, Fingerprint } from "lucide-react";
import { logger } from "@/lib/logger";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useToast } from "@/hooks/useToast";

interface BiometricGuardProps {
  children: ReactNode;
  onUnlock?: () => void;
  title?: string;
  requirePinSetup?: boolean;
}

export const BiometricGuard: FC<BiometricGuardProps> = ({
  children,
  onUnlock,
  title = "Seguridad Biométrica",
  requirePinSetup = true,
}) => {
  const { toast } = useToast();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [availableBiometric, setAvailableBiometric] = useState<"none" | "some">(
    "none",
  );
  const [setupStep, setSetupStep] = useState<"initial" | "confirm">("initial");
  const [tempPin, setTempPin] = useState("");

  // Usamos usePersistedState para persistencia segura del PIN
  // En producción enterprise, esto debería integrarse con SecureStorage
  const [storedPin, setStoredPin] = usePersistedState<string | null>(
    "user_pin",
    null,
  );

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    if (!Capacitor.isNativePlatform()) {
      // En web, saltamos biometría y forzamos PIN
      setShowPin(true);
      return;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      if ((result as any)?.isAvailable) {
        setAvailableBiometric("some");
        performBiometricAuth();
      } else {
        setShowPin(true);
      }
    } catch (error) {
      logger.error("Biometric check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      setShowPin(true);
    }
  };

  const performBiometricAuth = async () => {
    try {
      await NativeBiometric.verifyIdentity({
        reason: "Autenticación requerida para acceder",
        title: "Log in",
        subtitle: "Usa tu huella o FaceID",
        description: "Confirma tu identidad",
      });
      // Si no lanza error, consideramos la autenticación como exitosa
      handleSuccess();
    } catch (error) {
      logger.error("Biometric auth failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      setShowPin(true);
    }
  };

  const handleSuccess = () => {
    setIsUnlocked(true);
    onUnlock?.();
  };

  const handlePinSubmit = (pin: string) => {
    if (storedPin) {
      // Validar PIN
      if (pin === storedPin) {
        handleSuccess();
      } else {
        setPinError(true);
      }
    } else {
      // Setup PIN flow
      if (setupStep === "initial") {
        setTempPin(pin);
        setSetupStep("confirm");
      } else {
        if (pin === tempPin) {
          setStoredPin(pin);
          handleSuccess();
        } else {
          setPinError(true); // PINs don't match
          setSetupStep("initial");
          toast({
            title: "PINs no coinciden",
            description: "Los PINs no coinciden. Inténtalo de nuevo.",
            variant: "destructive",
          });
        }
      }
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  // Si no hay PIN configurado y estamos en modo setup
  if (!storedPin && requirePinSetup) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
        <Shield className="h-16 w-16 text-purple-600 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configurar Seguridad
        </h2>
        <p className="text-gray-600 mb-8 text-center">
          {setupStep === "initial"
            ? "Crea un PIN de 6 dígitos para proteger tu cuenta"
            : "Confirma tu PIN de 6 dígitos"}
        </p>

        <PinInput
          onComplete={handlePinSubmit}
          error={pinError}
          onReset={() => setPinError(false)}
          label={
            storedPin
              ? "Introduce tu PIN de seguridad"
              : setupStep === "initial"
                ? "Crea un PIN de seguridad"
                : "Confirma tu nuevo PIN"
          }
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm flex flex-col items-center">
        {availableBiometric !== "none" && !showPin ? (
          <div className="text-center">
            <Fingerprint className="h-20 w-20 text-blue-600 mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium text-gray-900">Escaneando...</p>
            <button
              onClick={() => setShowPin(true)}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Usar PIN
            </button>
          </div>
        ) : (
          <>
            <Lock className="h-12 w-12 text-gray-800 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
            <PinInput
              onComplete={handlePinSubmit}
              error={pinError}
              onReset={() => setPinError(false)}
            />
            {availableBiometric !== "none" && (
              <button
                onClick={performBiometricAuth}
                className="mt-6 flex items-center text-gray-600 hover:text-gray-900"
              >
                <Fingerprint className="h-5 w-5 mr-2" />
                Usar Biometría
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
