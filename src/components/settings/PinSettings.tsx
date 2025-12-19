import React, { useState } from 'react';
import { KeyRound, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { usePersistedState } from '@/hooks/usePersistedState';
import { Button } from '@/components/ui/Button';

export const PinSettings: React.FC = () => {
  const { toast } = useToast();
  const [storedPin, setStoredPin] = usePersistedState<string>('app_pin', '');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const hasPin = !!storedPin;

  const handleSetPin = () => {
    if (newPin.length !== 4) {
      toast({ title: 'Error', description: 'El PIN debe tener 4 dígitos', variant: 'destructive' });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: 'Error', description: 'Los PINs no coinciden', variant: 'destructive' });
      return;
    }

    setStoredPin(newPin);
    setIsSettingPin(false);
    setNewPin('');
    setConfirmPin('');
    setCurrentPin('');
    toast({ title: 'Éxito', description: 'PIN configurado correctamente' });
  };

  const handleChangePin = () => {
    if (currentPin !== storedPin) {
      toast({ title: 'Error', description: 'PIN actual incorrecto', variant: 'destructive' });
      return;
    }
    handleSetPin();
  };

  const handleRemovePin = () => {
    if (currentPin !== storedPin) {
      toast({ title: 'Error', description: 'Ingresa tu PIN actual para eliminarlo', variant: 'destructive' });
      return;
    }
    setStoredPin('');
    setIsSettingPin(false);
    setCurrentPin('');
    toast({ title: 'Éxito', description: 'PIN eliminado' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <KeyRound className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">PIN de Seguridad</h3>
          <p className="text-sm text-gray-600">Configura un PIN de 4 dígitos para acceso rápido y seguridad adicional</p>
        </div>
      </div>

      <div className={`p-4 rounded-lg border ${
        hasPin 
          ? 'bg-green-50 border-green-200' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {hasPin ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-gray-400" />
            )}
            <span className={`font-medium ${hasPin ? 'text-green-800' : 'text-gray-700'}`}>
              {hasPin ? 'PIN Configurado' : 'Sin PIN configurado'}
            </span>
          </div>
          
          {!isSettingPin && (
            <Button 
              variant={hasPin ? "outline" : "default"} 
              size="sm" 
              onClick={() => setIsSettingPin(true)}
            >
              {hasPin ? 'Cambiar PIN' : 'Configurar PIN'}
            </Button>
          )}
        </div>

        {isSettingPin && (
          <div className="space-y-4 mt-4 border-t border-gray-200 pt-4 animate-in slide-in-from-top-2">
            {hasPin && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">PIN Actual</label>
                <input
                  type="password"
                  maxLength={4}
                  className="w-full p-2 border rounded-md bg-white text-center text-2xl tracking-widest"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  autoFocus
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nuevo PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  className="w-full p-2 border rounded-md bg-white text-center text-2xl tracking-widest"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Confirmar PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  className="w-full p-2 border rounded-md bg-white text-center text-2xl tracking-widest"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => {
                setIsSettingPin(false);
                setNewPin('');
                setConfirmPin('');
                setCurrentPin('');
              }}>
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
                disabled={newPin.length !== 4 || confirmPin.length !== 4 || (hasPin && currentPin.length !== 4)}
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
          <li>Úsalo para desbloquear contenido sensible y confirmar acciones.</li>
          <li>Si olvidas tu PIN, tendrás que restablecerlo autenticándote nuevamente.</li>
        </ul>
      </div>
    </div>
  );
};
