import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { LogOut, X, Shield, User, Settings } from "lucide-react";
import { motion } from "framer-motion";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
  userRole?: string;
}

export const LogoutModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName = "Usuario", 
  userRole = "usuario" 
}: LogoutModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  // Manejar tecla ESC para cerrar
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!mounted || !isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      {/* Overlay con animación */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ 
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header Gradient */}
          <div className="bg-linear-to-r from-red-500 via-pink-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="p-2 bg-white/20 rounded-full"
                >
                  <LogOut className="w-6 h-6" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold">Cerrar Sesión</h2>
                  <p className="text-white/80 text-sm">Confirmar acción</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-3 bg-linear-to-br from-purple-500 to-pink-500 rounded-full">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{userName}</p>
                <p className="text-sm text-gray-600 capitalize">{userRole}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            {/* Warning Message */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  ¿Estás seguro de cerrar tu sesión?
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Serás redirigido a la página principal y deberás iniciar sesión nuevamente para acceder a tu cuenta.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-linear-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>

            {/* Additional Info */}
            <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
              <p>Tu sesión actual permanecerá activa por 30 minutos</p>
            </div>
          </CardContent>

          {/* Animated Border Effect */}
          <motion.div
            className="absolute inset-0 border-2 border-purple-500/20 rounded-lg pointer-events-none"
            animate={{
              borderColor: [
                "rgba(168, 85, 247, 0.2)",
                "rgba(236, 72, 153, 0.2)",
                "rgba(168, 85, 247, 0.2)"
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </Card>
      </motion.div>
    </div>,
    document.body,
  );
};
