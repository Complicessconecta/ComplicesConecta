import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ClubNameValidatorProps {
  name: string;
  onValidationChange?: (isValid: boolean, message?: string) => void;
  onNameSelect?: (name: string) => void;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
  suggestions?: string[];
}

const ClubNameValidator: React.FC<ClubNameValidatorProps> = ({
  name,
  onValidationChange,
  onNameSelect
}) => {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    message: ''
  });
  const [isValidating, setIsValidating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Validación básica de formato
  const validateFormat = (name: string): ValidationResult => {
    if (!name || name.trim().length === 0) {
      return {
        isValid: false,
        message: 'El nombre del club es requerido'
      };
    }

    if (name.length < 3) {
      return {
        isValid: false,
        message: 'El nombre debe tener al menos 3 caracteres'
      };
    }

    if (name.length > 50) {
      return {
        isValid: false,
        message: 'El nombre no puede exceder 50 caracteres'
      };
    }

    // Validar caracteres permitidos
    const validPattern = /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ&'-]+$/;
    if (!validPattern.test(name)) {
      return {
        isValid: false,
        message: 'Solo se permiten letras, números, espacios y caracteres básicos'
      };
    }

    return {
      isValid: true,
      message: ''
    };
  };

  // Generar sugerencias de nombres
  const generateSuggestions = (originalName: string): string[] => {
    const baseName = originalName.trim();
    const suggestions: string[] = [];

    // Sugerencia 1: Agregar año
    suggestions.push(`${baseName} 2026`);

    // Sugerencia 2: Agregar "Club"
    if (!baseName.toLowerCase().includes('club')) {
      suggestions.push(`${baseName} Club`);
    }

    // Sugerencia 3: Agregar location
    suggestions.push(`${baseName} CDMX`);

    // Sugerencia 4: Versión corta
    if (baseName.length > 20) {
      suggestions.push(baseName.substring(0, 20).trim());
    }

    // Sugerencia 5: Con "The" prefix
    if (!baseName.toLowerCase().startsWith('the')) {
      suggestions.push(`The ${baseName}`);
    }

    return suggestions.slice(0, 5); // Máximo 5 sugerencias
  };

  // Validar nombre contra "base de datos" (mock)
  const validateNameAvailability = async (name: string): Promise<ValidationResult> => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    // Lista de nombres existentes (mock)
    const existingNames = [
      'Mystic Garden',
      'Noche VIP',
      'Club Demo',
      'Luna Lounge',
      'Solar Club',
      'Velvet Room',
      'Neon Dreams',
      'Crystal Palace'
    ];

    const normalizedName = name.toLowerCase().trim();
    const isTaken = existingNames.some(existing => 
      existing.toLowerCase() === normalizedName
    );

    if (isTaken) {
      const suggestions = generateSuggestions(name);
      return {
        isValid: false,
        message: 'Este nombre ya está en uso',
        suggestions
      };
    }

    return {
      isValid: true,
      message: 'Nombre disponible'
    };
  };

  // Efecto para validar cuando cambia el nombre
  useEffect(() => {
    if (!name || name.trim().length === 0) {
      setValidation({ isValid: false, message: '' });
      onValidationChange?.(false);
      return;
    }

    const validate = async () => {
      setIsValidating(true);
      
      // Primero validar formato
      const formatValidation = validateFormat(name);
      if (!formatValidation.isValid) {
        setValidation(formatValidation);
        onValidationChange?.(false, formatValidation.message);
        setIsValidating(false);
        return;
      }

      // Luego validar disponibilidad
      try {
        const availabilityValidation = await validateNameAvailability(name);
        setValidation(availabilityValidation);
        onValidationChange?.(availabilityValidation.isValid, availabilityValidation.message);
        
        if (availabilityValidation.suggestions && availabilityValidation.suggestions.length > 0) {
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } catch (error) {
        setValidation({
          isValid: false,
          message: 'Error al validar el nombre'
        });
        onValidationChange?.(false, 'Error al validar el nombre');
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(validate, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [name, onValidationChange]);

  const handleSuggestionClick = (suggestion: string) => {
    onNameSelect?.(suggestion);
    setShowSuggestions(false);
  };

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }

    if (!name || name.trim().length === 0) {
      return null;
    }

    if (validation.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = () => {
    if (!name || name.trim().length === 0) {
      return 'text-gray-500';
    }

    if (validation.isValid) {
      return 'text-green-600';
    }

    return 'text-red-600';
  };

  return (
    <div className="space-y-3">
      {/* Estado de validación */}
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {validation.message || 'Escribe un nombre para validar'}
        </span>
      </div>

      {/* Sugerencias */}
      {showSuggestions && validation.suggestions && validation.suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">
              Sugerencias disponibles:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {validation.suggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Reglas de validación */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 3-50 caracteres</p>
        <p>• Letras, números, espacios y caracteres básicos</p>
        <p>• Nombre único y no duplicado</p>
      </div>
    </div>
  );
};

export default ClubNameValidator;
