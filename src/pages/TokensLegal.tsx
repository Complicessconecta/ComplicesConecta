import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Scale, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/Button";
import { useAuth } from '@/features/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { LegalChatBox } from '@/components/ai/LegalChatBox';
import type { RelationshipStatus } from '@/ai/AIWorker';

export default function TokensLegal() {
  const navigate = useNavigate();
  const { user, shouldUseRealSupabase } = useAuth();
  const [markdown, setMarkdown] = useState('');
  const [hasActivePrenup, setHasActivePrenup] = useState(false);
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>('ACTIVE');

  useEffect(() => {
    fetch('/docs/legal/TOKENS_LEGAL.md')
      .then(response => response.text())
      .then(text => setMarkdown(text));
  }, []);

  // Cargar estado legal real para el chat (contrato activo + disputas)
  useEffect(() => {
    const loadLegalState = async () => {
      if (!user?.id || !shouldUseRealSupabase()) {
        setHasActivePrenup(false);
        setRelationshipStatus('ACTIVE');
        return;
      }

      if (!supabase) {
        logger.error('Supabase no está inicializado para TokensLegal');
        setHasActivePrenup(false);
        setRelationshipStatus('ACTIVE');
        return;
      }

      try {
        // 1) Buscar contrato de pareja ACTIVO ligado al usuario
        const { data: agreement, error: agreementError } = await supabase
          .from('couple_agreements')
          .select('id, status')
          .or(`partner_1_id.eq.${user.id},partner_2_id.eq.${user.id}`)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (agreementError && agreementError.code !== 'PGRST116') {
          logger.error('Error obteniendo acuerdo activo en TokensLegal', { agreementError });
          setHasActivePrenup(false);
          setRelationshipStatus('ACTIVE');
          return;
        }

        if (!agreement || agreement.status !== 'ACTIVE') {
          setHasActivePrenup(false);
          setRelationshipStatus('ACTIVE');
          return;
        }

        setHasActivePrenup(true);

        // 2) Buscar última disputa ligada a ese acuerdo
        const { data: dispute, error: disputeError } = await supabase
          .from('couple_disputes')
          .select('resolved_at, resolution_type')
          .eq('couple_agreement_id', agreement.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (disputeError && disputeError.code !== 'PGRST116') {
          logger.error('Error obteniendo disputa en TokensLegal', { disputeError });
          setRelationshipStatus('ACTIVE');
          return;
        }

        if (!dispute) {
          setRelationshipStatus('ACTIVE');
        } else if (!dispute.resolved_at) {
          setRelationshipStatus('FROZEN_DISPUTE');
        } else {
          setRelationshipStatus('DISSOLVED');
        }
      } catch (error) {
        logger.error('Error cargando estado legal en TokensLegal', { error: String(error) });
        setHasActivePrenup(false);
        setRelationshipStatus('ACTIVE');
      }
    };

    void loadLegalState();
  }, [user?.id, shouldUseRealSupabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-900/80 via-purple-800/80 to-blue-900/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/tokens')}
              className="text-white hover:bg-white/10 btn-accessible bg-transparent border-none"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="truncate">Regresar</span>
            </Button>
            
            <h1 className="text-xl font-bold text-white">Responsabilidad Legal - Tokens</h1>
            
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Responsabilidad Legal
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Sistema de Tokens CMPX/GTK
            </span>
          </h1>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border border-primary/10">
          <CardHeader>
            <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
              <Scale className="h-4 w-4 text-purple-300" />
              Marco Legal de Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none p-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {markdown}
            </ReactMarkdown>
          </CardContent>
        </Card>

        {/* Asistente Legal de Tokens (IA Local) */}
        <Card className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl">
          <CardHeader className="pb-3 flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
              <Shield className="h-5 w-5 text-cyan-400" />
              Asistente Legal de Tokens
            </CardTitle>
            <p className="text-xs text-white/70 max-w-2xl">
              Haz preguntas como
              {' '}
              <span className="text-white/90">
                "¿Por qué mis activos están congelados?", "¿Por qué no puedo comprar NFTs?",
                "¿Qué validez tiene mi firma?".
              </span>
            </p>
          </CardHeader>
          <CardContent>
            <LegalChatBox
              hasActivePrenup={hasActivePrenup}
              relationshipStatus={relationshipStatus}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
