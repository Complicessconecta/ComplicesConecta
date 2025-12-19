import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/cn';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  error?: boolean;
  onReset?: () => void;
  label?: string;
}

export const PinInput: React.FC<PinInputProps> = ({
  length = 6,
  onComplete,
  error = false,
  onReset,
  label = "Introduce tu PIN de seguridad"
}) => {
  const [pin, setPin] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (error) {
      // Shake animation or visual feedback could be triggered here
      const timeout = setTimeout(() => {
        setPin(new Array(length).fill(''));
        inputRefs.current[0]?.focus();
        onReset?.();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [error, length, onReset]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.every(digit => digit !== '')) {
      onComplete(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <label className="text-gray-700 font-medium text-lg">{label}</label>
      <div className="flex space-x-2">
        {pin.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            className={cn(
              "w-10 h-12 text-center text-xl border-2 rounded-lg focus:outline-none focus:border-purple-600 transition-colors",
              error ? "border-red-500 text-red-500" : "border-gray-300 text-gray-900",
              digit ? "bg-gray-50" : "bg-white"
            )}
          />
        ))}
      </div>
      {error && <p className="text-red-500 text-sm">PIN incorrecto. Inténtalo de nuevo.</p>}
    </div>
  );
};
