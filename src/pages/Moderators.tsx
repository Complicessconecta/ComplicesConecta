import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Button } from '@/components/ui/buttons/Button';
import { Badge } from '@/components/ui/badge';
import { DecorativeHearts } from '@/components/DecorativeHearts';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  CheckCircle, 
  Star,
  Clock,
  DollarSign,
  Award,
  Timer,
  Calendar,
  UserCheck,
  Eye,
  MessageSquare,
  Settings,
  BarChart3,
  Zap,
  Crown,
  Sparkles
} from 'lucide-react';

const Moderators = () => {
  const navigate = useNavigate();

  // InformaciÃ³n del sistema de moderaciÃ³n desde la documentaciÃ³n
  const moderatorHierarchy = [
    {
      level: "SuperAdmin",
      revenuePercentage: "30%",
      hoursWeek: "40+",
      paymentMethod: "50% CMPX + 50% MXN",
      color: "from-yellow-400 to-orange-500",
      icon: <Crown className="h-6 w-6" />,
      responsibilities: [
        "SupervisiÃ³n general de la plataforma",
        "GestiÃ³n de equipo de moderadores",
        "Decisiones estratÃ©gicas de moderaciÃ³n",
        "CoordinaciÃ³n con desarrollo y legal"
      ]
    },
    {
      level: "Elite",
      revenuePercentage: "8%",
      hoursWeek: "20+",
      paymentMethod: "50% CMPX + 50% MXN",
      color: "from-purple-500 to-pink-600",
      icon: <Star className="h-6 w-6" />,
      responsibilities: [
        "ModeraciÃ³n avanzada de contenido",
        "SupervisiÃ³n de moderadores Junior/Senior",
        "GestiÃ³n de casos complejos",
        "Entrenamiento de nuevos moderadores"
      ]
    },
    {
      level: "Senior",
      revenuePercentage: "5%",
      hoursWeek: "10-19",
      paymentMethod: "70% CMPX + 30% MXN",
      color: "from-blue-500 to-cyan-600",
      icon: <Award className="h-6 w-6" />,
      responsibilities: [
        "ModeraciÃ³n de contenido especializada",
        "RevisiÃ³n de reportes complejos",
        "Mentoring de moderadores Junior",
        "ImplementaciÃ³n de polÃ­ticas"
      ]
    },
    {
      level: "Junior",
      revenuePercentage: "3%",
      hoursWeek: "5-9",
      paymentMethod: "100% CMPX",
      color: "from-green-500 to-emerald-600",
      icon: <UserCheck className="h-6 w-6" />,
      responsibilities: [
        "ModeraciÃ³n bÃ¡sica de contenido",
        "RevisiÃ³n de reportes estÃ¡ndar",
        "VerificaciÃ³n de perfiles",
        "AplicaciÃ³n de polÃ­ticas bÃ¡sicas"
      ]
    },
    {
      level: "Trainee",
      revenuePercentage: "Fijo: 1,000 CMPX",
      hoursWeek: "2-4",
      paymentMethod: "100% CMPX",
      color: "from-gray-500 to-gray-600",
      icon: <Users className="h-6 w-6" />,
      responsibilities: [
        "Aprendizaje de herramientas",
        "ModeraciÃ³n supervisada",
        "FamiliarizaciÃ³n con polÃ­ticas",
        "Entrenamiento bÃ¡sico"
      ]
    }
  ];

  const moderationTools = [
    {
      title: "Panel de Control 24/7",
      description: "Dashboard completo con mÃ©tricas en tiempo real y herramientas avanzadas",
      icon: <Settings className="h-8 w-8" />,
      features: [
        "Monitoreo en tiempo real",
        "MÃ©tricas de moderaciÃ³n",
        "Alertas automÃ¡ticas",
        "Reportes detallados"
      ]
    },
    {
      title: "Sistema de Timer AutomÃ¡tico",
      description: "Tracking preciso de horas trabajadas con pagos automÃ¡ticos semanales",
      icon: <Timer className="h-8 w-8" />,
      features: [
        "Inicio/pausa automÃ¡tico",
        "Tracking por actividad",
        "Reportes semanales",
        "IntegraciÃ³n con pagos"
      ]
    },
    {
      title: "Herramientas de ModeraciÃ³n",
      description: "Suite completa de herramientas para moderaciÃ³n eficiente",
      icon: <Shield className="h-8 w-8" />,
      features: [
        "RevisiÃ³n de contenido",
        "Sistema de reportes",
        "Acciones masivas",
        "Historial de moderaciÃ³n"
      ]
    },
    {
      title: "Sistema de Pagos AutomÃ¡tico",
      description: "Pagos semanales automÃ¡ticos basados en revenue y horas trabajadas",
      icon: <DollarSign className="h-8 w-8" />,
      features: [
        "Pagos cada lunes 00:00",
        "Stripe Payout (MXN)",
        "Tokens CMPX automÃ¡ticos",
        "Reportes de pagos"
      ]
    }
  ];

  const paymentExample = {
    scenario: "Moderador Elite - Semana tÃ­pica",
    weeklyRevenue: "$100,000 MXN",
    moderatorShare: "8% = $8,000 MXN",
    hoursWorked: "25 horas",
    payment: {
      mxn: "$4,000 MXN (50%)",
      cmpx: "4,000 CMPX (50%)"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 relative overflow-hidden">
      {/* Background decorativo */}
      <DecorativeHearts count={8} />
      
      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold mb-4">
              ðŸ›¡ï¸ SISTEMA DE MODERACIÃ“N 24/7
            </Badge>
            <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-white mb-6 leading-tight">
              Ãšnete al Equipo de
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Moderadores</span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Sistema profesional con jerarquÃ­a de 5 niveles, pagos automÃ¡ticos basados en revenue 
              y herramientas avanzadas de moderaciÃ³n 24/7.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30 px-4 py-2 text-base">
                <DollarSign className="h-4 w-4 mr-2" />
                Pagos AutomÃ¡ticos
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-400/30 px-4 py-2 text-base">
                <Timer className="h-4 w-4 mr-2" />
                Timer AutomÃ¡tico
              </Badge>
              <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-400/30 px-4 py-2 text-base">
                <Shield className="h-4 w-4 mr-2" />
                Herramientas Pro
              </Badge>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => navigate('/moderator-request')} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold"
              >
                <UserCheck className="w-5 h-5 mr-2" />
                Aplicar Ahora
              </Button>
              <Button 
                onClick={() => navigate('/moderator-dashboard')} 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg"
              >
                <Eye className="w-5 h-5 mr-2" />
                Dashboard Demo
              </Button>
            </div>
          </motion.div>

          {/* JerarquÃ­a de Moderadores */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              JerarquÃ­a de Moderadores
            </h2>
            <p className="text-lg text-white/70 text-center mb-12 max-w-2xl mx-auto">
              Sistema profesional de 5 niveles con pagos automÃ¡ticos basados en porcentaje de revenue
            </p>
            
            <div className="space-y-6">
              {moderatorHierarchy.map((level, index) => (
                <motion.div
                  key={level.level}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className={`bg-gradient-to-r ${level.color}/20 backdrop-blur-xl border-white/20 shadow-2xl`}>
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className={`p-3 bg-gradient-to-r ${level.color} rounded-lg text-white`}>
                          {level.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span>{level.level}</span>
                            <Badge className="bg-white/20 text-white border-white/30">
                              {level.revenuePercentage} Revenue
                            </Badge>
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* InformaciÃ³n bÃ¡sica */}
                        <div>
                          <h4 className="font-semibold text-white mb-3">InformaciÃ³n</h4>
                          <div className="space-y-2 text-white/80">
                            <div className="flex justify-between">
                              <span>Horas/Semana:</span>
                              <span className="font-semibold text-white">{level.hoursWeek}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pago:</span>
                              <span className="font-semibold text-white">{level.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Revenue:</span>
                              <span className="font-semibold text-white">{level.revenuePercentage}</span>
                            </div>
                          </div>
                        </div>

                        {/* Responsabilidades */}
                        <div className="md:col-span-2">
                          <h4 className="font-semibold text-white mb-3">Responsabilidades</h4>
                          <div className="grid md:grid-cols-2 gap-2">
                            {level.responsibilities.map((responsibility, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-white/80 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <span>{responsibility}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Sistema de Pagos */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-20"
          >
            <Card className="bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20 backdrop-blur-xl border-green-400/30 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  Sistema de Pagos AutomÃ¡ticos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Proceso de Pago */}
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-400" />
                      Proceso de Pago Semanal
                    </h4>
                    <div className="space-y-3">
                      {[
                        { step: "1. PerÃ­odo", detail: "Semanal (lunes a domingo)" },
                        { step: "2. CÃ¡lculo", detail: "Basado en revenue total de la semana" },
                        { step: "3. DistribuciÃ³n", detail: "SegÃºn nivel y horas trabajadas" },
                        { step: "4. Pago", detail: "AutomÃ¡tico cada lunes a las 00:00" },
                        { step: "5. MÃ©todo", detail: "Stripe Payout (MXN) + Tokens CMPX" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white flex-shrink-0 text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h5 className="font-semibold text-white">{item.step}</h5>
                            <p className="text-white/70 text-sm">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ejemplo de CÃ¡lculo */}
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-400" />
                      Ejemplo de CÃ¡lculo
                    </h4>
                    <div className="bg-white/10 rounded-lg p-6 border border-white/20">
                      <h5 className="font-semibold text-white mb-4">{paymentExample.scenario}</h5>
                      <div className="space-y-3 text-white/90">
                        <div className="flex justify-between">
                          <span>Revenue semanal:</span>
                          <span className="font-bold text-white">{paymentExample.weeklyRevenue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Share del moderador:</span>
                          <span className="font-bold text-white">{paymentExample.moderatorShare}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Horas trabajadas:</span>
                          <span className="font-bold text-white">{paymentExample.hoursWorked}</span>
                        </div>
                        <div className="border-t border-white/20 pt-3 mt-3">
                          <div className="text-center">
                            <p className="text-white font-semibold mb-2">Pago Total:</p>
                            <div className="space-y-1">
                              <div className="text-green-300 font-bold">{paymentExample.payment.mxn}</div>
                              <div className="text-purple-300 font-bold">{paymentExample.payment.cmpx}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Herramientas de ModeraciÃ³n */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Herramientas Profesionales
            </h2>
            <p className="text-lg text-white/70 text-center mb-12 max-w-2xl mx-auto">
              Suite completa de herramientas avanzadas para moderaciÃ³n eficiente y profesional
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {moderationTools.map((tool, index) => (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-colors h-full">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-white flex items-start gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white flex-shrink-0">
                          {tool.icon}
                        </div>
                        <div>
                          <div>{tool.title}</div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-white/80 leading-relaxed">
                        {tool.description}
                      </p>
                      
                      <div className="space-y-2">
                        <h5 className="text-white font-semibold text-sm">CaracterÃ­sticas:</h5>
                        <ul className="space-y-1">
                          {tool.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-white/70 text-sm">
                              <Zap className="h-3 w-3 text-blue-400 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-blue-600/30 backdrop-blur-xl border-purple-400/30 shadow-2xl">
              <CardContent className="p-12">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6"
                >
                  <Sparkles className="h-12 w-12 text-white" />
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                  Â¿Listo para Ser Moderador?
                </h2>
                <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Ãšnete a nuestro equipo profesional de moderadores y forma parte de la comunidad 
                  mÃ¡s segura y respetada de MÃ©xico.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Button
                    onClick={() => navigate('/moderator-request')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-10 py-4 text-lg shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <UserCheck className="h-5 w-5 mr-2" />
                    Aplicar como Moderador
                  </Button>
                  <Button
                    onClick={() => navigate('/support')}
                    className="border-2 border-white/30 text-white hover:bg-white/10 px-10 py-4 text-lg backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    MÃ¡s InformaciÃ³n
                  </Button>
                </div>

                <div className="flex flex-wrap justify-center gap-4 text-white/80">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Disponible 24/7</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Pagos AutomÃ¡ticos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Herramientas Profesionales</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Moderators;

