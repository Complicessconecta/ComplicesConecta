/**
 * PÃ¡gina principal de Tokens CMPX/GTK
 * Dashboard completo para gestiÃ³n de tokens con informaciÃ³n oficial
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Home, 
  Coins, 
  Info,
  DollarSign,
  TrendingUp,
  Rocket,
  Shield,
  Star,
  BarChart3,
  Wallet,
  Gift,
  Sparkles,
  Camera,
  Crown
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { TokenDashboard } from '@/components/tokens/TokenDashboard';
import { StakingModal } from '@/components/tokens/StakingModal';
import { TokenChatBot } from '@/components/tokens/TokenChatBot';
import { useAuth } from '@/features/auth/useAuth';
import { nftService } from '@/services/NFTService';
import { logger } from '@/lib/logger';
import { DecorativeHearts } from '@/components/DecorativeHearts';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useBiometricAuth } from '@/features/auth/useBiometricAuth';

export default function Tokens() {
  const [showStakingModal, setShowStakingModal] = useState(false);
  const { isAuthenticated, user, shouldUseRealSupabase, profile } = useAuth();
  const [walletNFTs, setWalletNFTs] = useState<any[]>([]);
  const [_nftsLoading, setNftsLoading] = useState(false);
  const [agreementMeta, setAgreementMeta] = useState<{
    id: string;
    agreementHash: string;
    signedAt: string | null;
    signerIp: string | null;
  } | null>(null);
  const [sessionIP, setSessionIP] = useState<string>('');
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [hasActivePrenup, setHasActivePrenup] = useState(false);
  const navigate = useNavigate();
  const {
    authenticate,
    verifyPin,
    isBiometricAvailable,
    isBiometricEnabled,
    hasPin,
  } = useBiometricAuth();
  
  // Determinar si hay sesiÃ³n activa
  const hasActiveSession = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);
  
  // Cargar NFTs de la wallet cuando hay sesiÃ³n real
  useEffect(() => {
    const loadUserNFTs = async () => {
      if (!hasActiveSession || !user?.id || !shouldUseRealSupabase()) {
        setWalletNFTs([]);
        return;
      }
      try {
        setNftsLoading(true);
        const nfts = await nftService.getUserNFTs(user.id);
        setWalletNFTs(nfts || []);
      } catch (error) {
        logger.error('Error cargando NFTs de usuario para Tokens:', { error: String(error) });
        setWalletNFTs([]);
      } finally {
        setNftsLoading(false);
      }
    };

    void loadUserNFTs();
  }, [hasActiveSession, user?.id, shouldUseRealSupabase]);

  // Cargar evidencia legal (acuerdo activo y IP real) para Wallet / Staking
  useEffect(() => {
    const loadLegalEvidence = async () => {
      if (!hasActiveSession || !user?.id || !shouldUseRealSupabase()) {
        setAgreementMeta(null);
        setHasActivePrenup(false);
        return;
      }

      try {
        setIsLoadingEvidence(true);

        // Obtener IP real para esta sesiÃ³n
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          if (ipResponse.ok) {
            const data = await ipResponse.json();
            setSessionIP(data.ip);
          }
        } catch (ipError) {
          logger.warn('No se pudo obtener IP para evidencia legal en Tokens', { ipError });
        }

        if (!supabase) {
          logger.error('Supabase no estÃ¡ inicializado para evidencia legal en Tokens');
          setAgreementMeta(null);
          setHasActivePrenup(false);
          return;
        }

        const { data, error } = await supabase
          .from('couple_agreements')
          .select('id, agreement_hash, status, signed_at, partner_1_id, partner_2_id, partner_1_ip, partner_2_ip')
          .or(`partner_1_id.eq.${user.id},partner_2_id.eq.${user.id}`)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          logger.error('Error obteniendo acuerdo activo para evidencia legal en Tokens', { error });
          setAgreementMeta(null);
          setHasActivePrenup(false);
          return;
        }

        const row = data as any;

        if (row && row.status === 'ACTIVE') {
          let signerIp: string | null = null;
          if (row.partner_1_id === user.id) {
            signerIp = row.partner_1_ip ?? null;
          } else if (row.partner_2_id === user.id) {
            signerIp = row.partner_2_ip ?? null;
          } else {
            signerIp = row.partner_1_ip ?? row.partner_2_ip ?? null;
          }

          setAgreementMeta({
            id: row.id,
            agreementHash: row.agreement_hash,
            signedAt: row.signed_at,
            signerIp,
          });
          setHasActivePrenup(true);
        } else {
          setAgreementMeta(null);
          setHasActivePrenup(false);
        }
      } catch (error) {
        logger.error('Error cargando evidencia legal en Tokens', { error: String(error) });
        setAgreementMeta(null);
        setHasActivePrenup(false);
      } finally {
        setIsLoadingEvidence(false);
      }
    };

    void loadLegalEvidence();
  }, [hasActiveSession, user?.id, shouldUseRealSupabase]);

  // Cargar estadÃ­sticas globales

  // InformaciÃ³n de tokens desde la documentaciÃ³n
  const tokenInfo = {
    cmpx: {
      name: "Token CMPX",
      subtitle: "La Moneda de Consumo",
      description: "Suministro ilimitado diseÃ±ado para transacciones diarias dentro de la plataforma",
      supply: "Ilimitado",
      purpose: "Consumo diario",
      features: [
        "Compra directa con dinero real (MXN, USD, criptomonedas)",
        "Uso para regalos virtuales, eventos VIP, funciones premium",
        "Transferible entre usuarios de la comunidad",
        "Ingresos recurrentes para la plataforma",
        "Recompensas por referidos y actividades"
      ],
      useCases: [
        { icon: <Gift className="h-5 w-5" />, title: "Regalos Virtuales", desc: "Flores, chocolates y regalos personalizados" },
        { icon: <Crown className="h-5 w-5" />, title: "Eventos VIP", desc: "Entradas exclusivas para eventos privados" },
        { icon: <Star className="h-5 w-5" />, title: "Funciones Premium", desc: "Super likes, boosts y caracterÃ­sticas avanzadas" },
        { icon: <Camera className="h-5 w-5" />, title: "Contenido Exclusivo", desc: "Acceso a galerÃ­as privadas y contenido especial" },
        { icon: <Sparkles className="h-5 w-5" />, title: "PersonalizaciÃ³n", desc: "Temas exclusivos y elementos visuales" }
      ],
      distribution: [
        { percentage: "60%", purpose: "Venta directa (ingresos recurrentes)" },
        { percentage: "25%", purpose: "Recompensas por referidos y actividades" },
        { percentage: "10%", purpose: "Eventos especiales y promociones" },
        { percentage: "5%", purpose: "Reserva para desarrollo y marketing" }
      ]
    },
    gtk: {
      name: "Token GTK",
      subtitle: "La InversiÃ³n con Futuro Blockchain",
      description: "Suministro limitado para staking, inversiÃ³n y futuro blockchain",
      supply: "Limitado",
      purpose: "InversiÃ³n y Staking",
      features: [
        "Token de staking para ingresos pasivos",
        "PrÃ³xima integraciÃ³n blockchain (Q2-Q4 2026)",
        "APY: 15-35% segÃºn duraciÃ³n de staking",
        "Potencial de apreciaciÃ³n a largo plazo",
        "Acceso a funcionalidades blockchain exclusivas"
      ],
      stakingTiers: [
        { duration: "30 dÃ­as", apy: "15%", minAmount: "1,000 GTK" },
        { duration: "90 dÃ­as", apy: "20%", minAmount: "5,000 GTK" },
        { duration: "180 dÃ­as", apy: "25%", minAmount: "10,000 GTK" },
        { duration: "270 dÃ­as", apy: "30%", minAmount: "20,000 GTK" },
        { duration: "365 dÃ­as", apy: "35%", minAmount: "25,000 GTK" }
      ],
      roadmap: [
        { phase: "Q2 2026", milestone: "PreparaciÃ³n y auditorÃ­a de contratos" },
        { phase: "Q3 2026", milestone: "IDO en Uniswap/PancakeSwap" },
        { phase: "Q4 2026", milestone: "Funcionalidades blockchain completas" }
      ]
    }
  };

  const revenueProjections = [
    {
      year: "AÃ±o 1 (2026)",
      cmpxSales: "$500,000",
      subscriptions: "$200,000",
      total: "$700,000",
      color: "from-blue-500/20 to-cyan-500/20"
    },
    {
      year: "AÃ±o 2 (2027)", 
      cmpxSales: "$2,000,000",
      subscriptions: "$800,000",
      staking: "$100,000",
      total: "$2,900,000",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      year: "AÃ±o 3 (2028)",
      cmpxSales: "$5,000,000",
      subscriptions: "$2,000,000",
      blockchain: "$500,000",
      total: "$7,500,000",
      color: "from-green-500/20 to-emerald-500/20"
    }
  ];

  const investorAdvantages = [
    {
      title: "Token GTK con Potencial de ApreciaciÃ³n",
      description: "Suministro limitado = escasez = valor creciente. Staking genera ingresos pasivos.",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "EconomÃ­a Dual Sostenible",
      description: "CMPX genera ingresos recurrentes. GTK crea comunidad de inversores a largo plazo.",
      icon: <Coins className="h-6 w-6" />,
      color: "from-blue-500 to-cyan-600"
    },
    {
      title: "First Mover Advantage",
      description: "Primera plataforma social en MÃ©xico con token nativo. 40M+ usuarios potenciales.",
      icon: <Rocket className="h-6 w-6" />,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "DiversificaciÃ³n de Ingresos",
      description: "MÃºltiples flujos: tokens, blockchain, NFTs, eventos. Resiliente a cambios.",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "from-orange-500 to-red-600"
    }
  ];

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const requireSecureTokensAction = async (): Promise<boolean> => {
    const username = user?.id || 'anonymous';

    if (isBiometricEnabled && isBiometricAvailable) {
      const result = await authenticate(username);
      if (result.success) {
        return true;
      }
      if (result.method === 'pin' && hasPin) {
        const pin = window.prompt('Ingresa tu PIN de 6 dÃ­gitos para autorizar operaciones con tokens:');
        if (!pin) return false;
        return await verifyPin(pin);
      }
    } else if (hasPin) {
      const pin = window.prompt('Ingresa tu PIN de 6 dÃ­gitos para autorizar operaciones con tokens:');
      if (!pin) return false;
      return await verifyPin(pin);
    }

    return true;
  };

  const handleOpenStaking = async () => {
    if (!hasActiveSession) {
      navigate('/auth');
      return;
    }

    const isCoupleProfile = (profile as any)?.profile_type === 'couple';

    if (isCoupleProfile && !hasActivePrenup) {
      logger.info('AcciÃ³n de staking bloqueada por falta de acuerdo prenupcial activo', {
        userId: user?.id,
      });
      alert('AcciÃ³n Bloqueada: Se requiere un Acuerdo Prenupcial Activo para garantizar la transparencia de los activos compartidos.');
      return;
    }

    const ok = await requireSecureTokensAction();
    if (!ok) return;

    setShowStakingModal(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">
      {/* Corazones decorativos flotantes */}
      <DecorativeHearts count={8} />
      
      {/* Contenido Principal */}
      <div className="relative z-10 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold mb-4">
              ðŸ’° SISTEMA DUAL DE TOKENS
            </Badge>
            <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-white mb-6 leading-tight">
              Tokens
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"> CMPX & GTK</span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Dos tokens, dos propÃ³sitos: CMPX para consumo diario y GTK para inversiÃ³n blockchain. 
              EconomÃ­a digital Ãºnica con staking del 8-18% APY.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-400/30 px-4 py-2 text-base">
                <Coins className="h-4 w-4 mr-2" />
                CMPX Consumo
              </Badge>
              <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-400/30 px-4 py-2 text-base">
                <Rocket className="h-4 w-4 mr-2" />
                GTK InversiÃ³n
              </Badge>
              <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-400/30 px-4 py-2 text-base">
                <TrendingUp className="h-4 w-4 mr-2" />
                8-18% APY
              </Badge>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => navigate('/profile')} 
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-3 text-lg font-semibold flex items-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                <span>Mi Wallet</span>
                {!shouldUseRealSupabase() && (
                  <span className="ml-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-100 border border-yellow-400/40">
                    DEMO
                  </span>
                )}
              </Button>
              <Button 
                onClick={handleOpenStaking} 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Hacer Staking
              </Button>
            </div>
          </motion.div>

          {/* Dashboard de Tokens */}
          {hasActiveSession && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <TokenDashboard nfts={walletNFTs} isDemoMode={!shouldUseRealSupabase()} />
              </motion.div>

              {/* Evidencia Legal de TransacciÃ³n */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-16"
              >
                <Card className="bg-white/5 backdrop-blur-xl border border-yellow-500/50 animate-pulse rounded-2xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                      <Shield className="h-5 w-5 text-yellow-300" />
                      <span>Evidencia Legal de TransacciÃ³n</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 md:p-10 space-y-3 text-sm text-white/90">
                    {isLoadingEvidence ? (
                      <p className="text-white/70">Cargando seguridad...</p>
                    ) : (
                      <>
                        <p>
                          Seguridad de TransacciÃ³n:{' '}
                          {agreementMeta ? (
                            <>
                              Vinculada al Acuerdo #{agreementMeta.id}. Firma digital registrada desde{' '}
                              {agreementMeta.signerIp || sessionIP || 'IP en registro'} a las{' '}
                              {agreementMeta.signedAt
                                ? new Date(agreementMeta.signedAt).toLocaleString()
                                : 'pendiente de firma'}
                              .
                            </>
                          ) : (
                            <>
                              En espera de un Acuerdo Prenupcial Activo. Tus operaciones quedarÃ¡n registradas con IP,
                              timestamp y hash en cuanto el contrato se active.
                            </>
                          )}
                        </p>
                        <p className="text-[11px] text-white/70 break-all">
                          Hash de Seguridad: {agreementMeta?.agreementHash || 'Se generarÃ¡ y almacenarÃ¡ en Supabase al completar el acuerdo.'}
                          {' '}
                          | IP: {agreementMeta?.signerIp || sessionIP || 'pendiente de captura'}
                          {' '}
                          | Timestamp:{' '}
                          {agreementMeta?.signedAt
                            ? new Date(agreementMeta.signedAt).toLocaleString()
                            : 'pendiente de firma'}
                        </p>
                        <p className="text-[11px] text-white/60">
                          JurisdicciÃ³n: Protocolo de Arbitraje Digital CÃ³mplices.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {/* InformaciÃ³n de Tokens */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Dos Tokens, Dos PropÃ³sitos
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Token CMPX */}
              <Card className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div>{tokenInfo.cmpx.name}</div>
                      <div className="text-lg font-normal text-blue-300">{tokenInfo.cmpx.subtitle}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-10 space-y-6">
                  <p className="text-white/90 text-lg">{tokenInfo.cmpx.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-white">{tokenInfo.cmpx.supply}</div>
                      <div className="text-white/70 text-sm">Suministro</div>
                    </div>
                    <div className="p-3 bg-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-white">{tokenInfo.cmpx.purpose}</div>
                      <div className="text-white/70 text-sm">PropÃ³sito</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">Casos de Uso:</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {tokenInfo.cmpx.useCases.map((useCase, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300">
                            {useCase.icon}
                          </div>
                          <div>
                            <h5 className="font-semibold text-white text-sm">{useCase.title}</h5>
                            <p className="text-white/70 text-xs">{useCase.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">DistribuciÃ³n:</h4>
                    <div className="space-y-2">
                      {tokenInfo.cmpx.distribution.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                          <span className="text-white/80 text-sm">{item.purpose}</span>
                          <span className="font-bold text-blue-300">{item.percentage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Token GTK */}
              <Card className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                      <Rocket className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div>{tokenInfo.gtk.name}</div>
                      <div className="text-lg font-normal text-purple-300">{tokenInfo.gtk.subtitle}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/90 text-lg">{tokenInfo.gtk.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-white">{tokenInfo.gtk.supply}</div>
                      <div className="text-white/70 text-sm">Suministro</div>
                    </div>
                    <div className="p-3 bg-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-white">{tokenInfo.gtk.purpose}</div>
                      <div className="text-white/70 text-sm">PropÃ³sito</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">Staking Tiers:</h4>
                    <div className="space-y-2">
                      {tokenInfo.gtk.stakingTiers.map((tier, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <div>
                            <div className="font-semibold text-white text-sm">{tier.duration}</div>
                            <div className="text-white/70 text-xs">Min: {tier.minAmount}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-purple-300 text-lg">{tier.apy}</div>
                            <div className="text-white/70 text-xs">APY</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">Roadmap Blockchain:</h4>
                    <div className="space-y-2">
                      {tokenInfo.gtk.roadmap.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 bg-white/5 rounded">
                          <div className="font-bold text-purple-300 text-sm flex-shrink-0">{item.phase}</div>
                          <div className="text-white/80 text-sm">{item.milestone}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Proyecciones de Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-20"
          >
            <Card className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  Modelo de Ingresos Proyectado
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-10">
                <div className="grid md:grid-cols-3 gap-6">
                  {revenueProjections.map((projection, index) => (
                    <motion.div
                      key={projection.year}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl"
                    >
                      <h4 className="text-xl font-bold text-white mb-4">{projection.year}</h4>
                      <div className="space-y-2 text-white/80">
                        <div className="flex justify-between">
                          <span>Venta CMPX:</span>
                          <span className="font-bold text-white">{projection.cmpxSales}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Suscripciones:</span>
                          <span className="font-bold text-white">{projection.subscriptions}</span>
                        </div>
                        {projection.staking && (
                          <div className="flex justify-between">
                            <span>Staking:</span>
                            <span className="font-bold text-white">{projection.staking}</span>
                          </div>
                        )}
                        {projection.blockchain && (
                          <div className="flex justify-between">
                            <span>Blockchain:</span>
                            <span className="font-bold text-white">{projection.blockchain}</span>
                          </div>
                        )}
                        <div className="border-t border-white/20 pt-2 mt-2 flex justify-between">
                          <span className="font-semibold">Total:</span>
                          <span className="text-2xl font-black text-white">{projection.total}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ventajas para Inversores */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Ventajas para Inversores
            </h2>
            <p className="text-lg text-white/70 text-center mb-12 max-w-2xl mx-auto">
              Sistema dual de tokens diseÃ±ado para crear valor sostenible y oportunidades de crecimiento
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {investorAdvantages.map((advantage, index) => (
                <motion.div
                  key={advantage.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${advantage.color} text-white mb-4`}>
                    {advantage.icon}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">{advantage.title}</h4>
                  <p className="text-white/70 leading-relaxed">{advantage.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Botones de AcciÃ³n */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-blue-600/30 backdrop-blur-xl border-purple-400/30 shadow-2xl">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Â¿Listo para Comenzar con Tokens?
                </h3>
                
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                  <Button
                    onClick={() => navigate('/profile')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3"
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    Ver Mi Wallet
                  </Button>
                  
                  <Button
                    onClick={handleOpenStaking}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Hacer Staking
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/tokens-info')}
                    variant="premium"
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-3"
                  >
                    <Info className="w-5 h-5 mr-2" />
                    MÃ¡s InformaciÃ³n
                  </Button>
                </div>

                <div className="flex flex-wrap justify-center gap-4 text-white/80">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Seguro y Verificado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>8-18% APY Staking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    <span>Blockchain Ready</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* NavegaciÃ³n */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Inicio
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Modales */}
      {showStakingModal && (
        <StakingModal
          isOpen={showStakingModal}
          onClose={() => setShowStakingModal(false)}
        />
      )}

      {/* ChatBot de Tokens */}
      <TokenChatBot />
    </div>
  );
}

