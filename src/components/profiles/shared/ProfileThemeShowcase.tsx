import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { ProfileCard } from '@/components/profiles/shared/MainProfileCard';
import { ThemeSelector, ThemePreviewCard } from '@/components/ui/ThemeSelector';
import { UnifiedCard } from '@/components/ui/UnifiedCard';
import { Badge } from '@/components/ui/badge';
import { Palette, Users, User, Heart } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Theme, Gender, ProfileType } from '@/features/profile/useProfileTheme';
import { generateDemoProfiles } from '@/demo/demoData';
import { logger } from '@/lib/logger';

interface ProfileThemeShowcaseProps {
  className?: string;
}

export const ProfileThemeShowcase: React.FC<ProfileThemeShowcaseProps> = ({
  className
}) => {
  const [selectedTheme, setSelectedTheme] = useState<Theme | undefined>();
  const [selectedProfileType, setSelectedProfileType] = useState<ProfileType>('single');
  const [selectedGender, setSelectedGender] = useState<Gender>('male');
  const [selectedPartnerGender, setSelectedPartnerGender] = useState<Gender>('female');

  // Log interactions
  useEffect(() => {
    logger.info('ProfileThemeShowcase interaction', {
      selectedTheme,
      selectedProfileType,
      selectedGender,
      selectedPartnerGender
    });
  }, [selectedTheme, selectedProfileType, selectedGender, selectedPartnerGender]);

  // Generar perfiles demo con temas
  const demoProfiles = React.useMemo(() => generateDemoProfiles(6), []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  } as const;

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <Palette className="h-8 w-8 text-purple-600" />
          <h2 className="text-3xl font-bold text-gray-900">
            Personalización Visual de Perfiles
          </h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Descubre cómo los perfiles se adaptan visualmente según el género, tipo de relación y tema seleccionado.
          Cada combinación crea una experiencia única y personalizada.
        </p>
      </motion.div>

      {/* Configurador Interactivo */}
      <UnifiedCard className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-purple-600" />
          Configurador de Temas
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Controles */}
          <div className="space-y-4">
            {/* Tipo de Perfil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Perfil
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedProfileType('single')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                    selectedProfileType === 'single'
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <User className="h-4 w-4" />
                  Single
                </button>
                <button
                  onClick={() => setSelectedProfileType('couple')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                    selectedProfileType === 'couple'
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Pareja
                </button>
              </div>
            </div>

            {/* Género */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Género {selectedProfileType === 'couple' ? '(Principal)' : ''}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedGender('male')}
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 transition-all",
                    selectedGender === 'male'
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  Masculino
                </button>
                <button
                  onClick={() => setSelectedGender('female')}
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 transition-all",
                    selectedGender === 'female'
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  Femenino
                </button>
              </div>
            </div>

            {/* Género de Pareja */}
            {selectedProfileType === 'couple' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Género de Pareja
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPartnerGender('male')}
                    className={cn(
                      "px-4 py-2 rounded-lg border-2 transition-all",
                      selectedPartnerGender === 'male'
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    Masculino
                  </button>
                  <button
                    onClick={() => setSelectedPartnerGender('female')}
                    className={cn(
                      "px-4 py-2 rounded-lg border-2 transition-all",
                      selectedPartnerGender === 'female'
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    Femenino
                  </button>
                </div>
              </div>
            )}

            {/* Selector de Tema */}
            <ThemeSelector
              selectedTheme={selectedTheme}
              onThemeChange={setSelectedTheme}
              showPreview={true}
            />
          </div>

          {/* Vista Previa */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Vista Previa</h4>
            <ThemePreviewCard
              theme={selectedTheme}
              gender={selectedGender}
              accountType={selectedProfileType}
              partnerGender={selectedProfileType === 'couple' ? selectedPartnerGender : undefined}
              name={selectedProfileType === 'couple' ? 'Ana & Carlos' : 'María'}
              className="w-full"
            />
            
            {/* Descripción del tema actual */}
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Configuración:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Tipo: {selectedProfileType === 'single' ? 'Perfil Individual' : 'Perfil de Pareja'}</li>
                <li>
                  Géneros: {selectedGender === 'male' ? 'Masculino' : 'Femenino'}
                  {selectedProfileType === 'couple' && 
                    ` + ${selectedPartnerGender === 'male' ? 'Masculino' : 'Femenino'}`
                  }
                </li>
                <li>Tema: {selectedTheme ? 
                  (selectedTheme === 'elegant' ? 'Elegante' : 
                   selectedTheme === 'modern' ? 'Moderno' : 'Vibrante') 
                  : 'Por defecto (basado en género)'}</li>
              </ul>
            </div>
          </div>
        </div>
      </UnifiedCard>

      {/* Galería de Perfiles Demo */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Perfiles Demo con Temas Diversos
        </h3>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {demoProfiles.map((profile, _index) => (
            <motion.div
              key={profile.id}
              variants={itemVariants}
              className="space-y-3"
            >
              <ProfileCard
                profile={{
                  id: profile.id,
                  name: profile.name,
                  age: profile.age,
                  bio: profile.bio,
                  location: profile.location,
                  image: profile.image,
                  isOnline: profile.isOnline,
                  verified: profile.isVerified,
                  interests: profile.interests,
                }}
                onOpenModal={() => {}}
              />
              
              {/* Etiquetas informativas */}
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {profile.profileType === 'single' ? 'Single' : 'Pareja'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {profile.gender === 'male' ? '♂' : '♀'}
                  {profile.partnerGender && (profile.partnerGender === 'male' ? '♂' : '♀')}
                </Badge>
                {profile.theme && (
                  <Badge variant="secondary" className="text-xs">
                    {profile.theme === 'romantic' ? 'Romántico' : 'Aventurero'}
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Información sobre los temas */}
      <UnifiedCard className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          ¿Cómo Funcionan los Temas Visuales?
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-purple-700 mb-2">🎨 Temas por Género</h4>
            <p>Los perfiles single adaptan automáticamente sus colores según el género: tonos azules/grises para masculino, púrpuras/rosas para femenino.</p>
          </div>
          <div>
            <h4 className="font-medium text-purple-700 mb-2">💑 Temas para Parejas</h4>
            <p>Las parejas tienen fondos especiales según la combinación: hombre+mujer (púrpura-azul), mismo género (tonos coordinados).</p>
          </div>
          <div>
            <h4 className="font-medium text-purple-700 mb-2">✨ Temas Personalizados</h4>
            <p>Los usuarios pueden elegir temas adicionales (Elegante, Moderno, Vibrante) que sobrescriben los colores por defecto.</p>
          </div>
        </div>
      </UnifiedCard>
    </div>
  );
};

