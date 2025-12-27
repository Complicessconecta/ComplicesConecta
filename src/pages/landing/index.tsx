/**
 * =====================================================
 * LANDING PAGE ANIMADA
 * =====================================================
 * Página principal con partículas animadas neon
 * Features: Particles interactivas, gradientes, CTAs
 * Fecha: 21 Dic 2025
 * Versión: v3.6.6
 * =====================================================
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Heart, Shield, Sparkles } from 'lucide-react';
import { ParticlesNeonBackground } from '@/components/ui/ParticlesNeonBackground';
import { Button } from '@/components/ui/buttons/Button';
import { useAuth } from '@/features/auth/useAuth';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const { profile } = useAuth();

  return (
    <ParticlesNeonBackground className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge Premium */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Comunidad Exclusiva y Verificada
          </motion.div>

          {/* Título Principal */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Cómplices
            </span>
            <br />
            <span className="text-3xl md:text-5xl text-gray-300">
              Conecta
            </span>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Descubre conexiones auténticas en una comunidad segura y 
            <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-semibold">
              {" "}verificada
            </span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            {profile ? (
              <Link to="/discover">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl text-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                >
                  Explorar Comunidad
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl text-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                  >
                    Únete Ahora
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-purple-400 text-purple-300 hover:bg-purple-900/20 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300"
                  >
                    Iniciar Sesión
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full"
        >
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Comunidad Real</h3>
            <p className="text-gray-400">
              Perfiles verificados y miembros activos buscando conexiones genuinas
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Seguridad Total</h3>
            <p className="text-gray-400">
              Privacidad protegida y moderación constante para experiencias seguras
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Matches Inteligentes</h3>
            <p className="text-gray-400">
              IA avanzada para compatibilidad basada en intereses y preferencias
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-wrap justify-center gap-8 text-gray-400">
            <div>
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm">Miembros Activos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-sm">Satisfacción</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-sm">Soporte</div>
            </div>
          </div>
        </motion.div>
      </div>
    </ParticlesNeonBackground>
  );
};

export default LandingPage;


