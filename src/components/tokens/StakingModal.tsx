/**
 * Modal de Staking - Interfaz amigable para usuarios Beta
 * Explicación simple del staking con ejemplos y confirmación
 */

import React, { useState } from "react";
import { Dialog, DialogContent,  DialogHeader, DialogTitle } from "@/components/ui/Modal";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/cards/Card";
import { useTokens } from "@/hooks/useTokens";
import { useToast } from "@/hooks/useToast";
import { Lock, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StakingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StakingModal({ isOpen, onClose }: StakingModalProps) {
  const { balance, startStaking } = useTokens();
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  const stakingAmount = parseInt(amount) || 0;
  const rewardAmount = Math.round(stakingAmount * 0.1); // 10% reward
  const totalReturn = stakingAmount + rewardAmount;
  const maxAmount = balance?.cmpxBalance || 0;

  const minSwipeDistance = 60;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndY(null);
    const touch = e.targetTouches.item(0);
    if (!touch) return;
    setTouchStartY(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.targetTouches.item(0);
    if (!touch) return;
    setTouchEndY(touch.clientY);
  };

  const handleTouchEnd = () => {
    if (touchStartY === null || touchEndY === null) return;
    const distance = touchEndY - touchStartY;
    if (distance > minSwipeDistance) {
      onClose();
    }
  };

  const handleStaking = async () => {
    if (!stakingAmount || stakingAmount < 50) {
      setError("Mínimo 50 CMPX para staking");
      return;
    }

    if (stakingAmount > maxAmount) {
      setError(`No tienes suficientes CMPX. Máximo: ${maxAmount}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await startStaking(stakingAmount);

      if (result) {
        onClose();
        // Mostrar mensaje de éxito (podría ser un toast)
        toast({
          title: "🎉 ¡Staking iniciado!",
          description: `${stakingAmount} CMPX bloqueados por 30 días`,
        });
      } else {
        setError("No se pudo iniciar el staking");
      }
    } catch {
      setError("Error iniciando staking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent
            className="max-w-md bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-md border border-white/20 text-white"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  >
                    <Lock className="h-5 w-5" />
                  </motion.div>
                  🔒 Staking - Alcancía Especial
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Explicación simple */}
                <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-400/30">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-semibold">¿Qué es staking?</span>
                      </div>
                      <p className="text-sm text-white/90 break-words">
                        Es como una alcancía especial: guardas tus CMPX por 30
                        días y al final recibes un{" "}
                        <strong>+10% de recompensa</strong>.
                      </p>
                      <p className="text-sm text-white/80 break-words mt-2">
                        💡 <strong>Tip:</strong> Los tokens GTK también se
                        pueden usar para hacer staking (hasta 18% APY) y para
                        mint NFTs de tus galerías (1,000 GTK por galería).
                      </p>
                      <div className="bg-white/20 backdrop-blur-sm p-2 rounded border border-white/30">
                        <p className="text-xs text-white break-words">
                          💡 <strong>Ejemplo:</strong> Si pones 100 CMPX, en 30
                          días tendrás 110 CMPX
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Configuración de cantidad */}
                <div className="space-y-2">
                  <Label htmlFor="staking-amount" className="text-white">
                    Cantidad a poner en staking
                  </Label>
                  <div className="relative">
                    <Input
                      id="staking-amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="50"
                      max={maxAmount}
                      placeholder="100"
                      className="pr-16 bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-white/70">
                      CMPX
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-white/70">
                    <span className="truncate">Mínimo: 50 CMPX</span>
                    <span className="truncate">
                      Disponible: {maxAmount} CMPX
                    </span>
                  </div>
                </div>

                {/* Botones rápidos */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount("50")}
                    disabled={maxAmount < 50}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <span className="truncate">50</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount("100")}
                    disabled={maxAmount < 100}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <span className="truncate">100</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(maxAmount.toString())}
                    disabled={maxAmount < 50}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <span className="truncate">Max</span>
                  </Button>
                </div>

                {/* Resumen de recompensas */}
                {stakingAmount >= 50 && (
                  <Card className="bg-green-500/20 backdrop-blur-sm border-green-400/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-white">
                        <Calendar className="h-4 w-4" />
                        <span className="font-semibold">
                          Resumen del Staking
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/90 truncate">
                            Cantidad inicial:
                          </span>
                          <span className="font-semibold text-white flex-shrink-0 ml-2">
                            {stakingAmount} CMPX
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/90 truncate">
                            Duración:
                          </span>
                          <span className="font-semibold text-white flex-shrink-0 ml-2">
                            30 días
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/90 truncate">
                            Recompensa (10%):
                          </span>
                          <span className="font-semibold text-green-400 flex-shrink-0 ml-2">
                            +{rewardAmount} CMPX
                          </span>
                        </div>
                        <hr className="border-white/30" />
                        <div className="flex justify-between font-semibold">
                          <span className="text-white truncate">
                            Total al finalizar:
                          </span>
                          <span className="text-green-400 flex-shrink-0 ml-2">
                            {totalReturn} CMPX
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Advertencia importante */}
                <Card className="bg-yellow-500/20 backdrop-blur-sm border-yellow-400/30">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-white flex-1 min-w-0">
                        <p className="font-semibold mb-1">⚠️ Importante:</p>
                        <ul className="text-xs space-y-1 break-words">
                          <li>• Los tokens estarán bloqueados por 30 días</li>
                          <li>
                            • No podrás usarlos hasta que termine el período
                          </li>
                          <li>
                            • La recompensa se paga automáticamente al finalizar
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg">
                    <p className="text-white text-sm break-words">❌ {error}</p>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleStaking}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={
                      loading || stakingAmount < 50 || stakingAmount > maxAmount
                    }
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="truncate">Procesando...</span>
                      </div>
                    ) : (
                      <span className="truncate">🔒 Iniciar Staking</span>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
