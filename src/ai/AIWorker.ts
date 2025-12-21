// src/ai/AIWorker.ts
// Motor de IA local (stub listo para integrar WebLLM / Phi-3-mini)

export type RelationshipStatus = 'ACTIVE' | 'FROZEN_DISPUTE' | 'DISSOLVED';

export interface LegalRuntimeState {
  hasActivePrenup: boolean;
  relationshipStatus: RelationshipStatus;
}

export interface LoadProgress {
  stage: 'idle' | 'initializing' | 'downloading' | 'warming_up' | 'ready' | 'error';
  percent: number;
  message?: string;
}

export interface GenerateParams {
  userMessage: string;
  runtimeState?: LegalRuntimeState;
}

// Resumen comprimido de app-master-context.md
const MASTER_CONTEXT_SUMMARY = `
- El estado de la relación (ACTIVE / FROZEN_DISPUTE / DISSOLVED) se deriva de
  couple_agreements + couple_disputes.
- Sin contrato ACTIVO, no se permiten NFTs de pareja ni staking de activos
  compartidos.
- Con disputa abierta (sin resolved_at), los activos están congelados.
- Los 5 puntos de consentimiento cubren: firma digital vinculante (IP + hash),
  muerte súbita de 30 días, propiedad proindiviso, registro de evidencia y
  protocolo de congelación.
- /tokens muestra evidencia legal: Hash, IP y timestamp del acuerdo activo.
`;

const SYSTEM_PROMPT = `
Eres el AUDITOR LEGAL DE CÓMPLICES.

Tu trabajo es explicar, con claridad y precisión, el estado legal y operativo
relacionado con:
- Contratos de pareja (couple_agreements).
- Disputas y congelamiento de activos (couple_disputes).
- Gating de NFTs de pareja y staking.

Reglas:
- Usa únicamente el conocimiento del app-master-context.md (resumido en
  MASTER_CONTEXT_SUMMARY) y el estado runtime (hasActivePrenup,
  relationshipStatus).
- Si el usuario pregunta "¿Por qué mis activos están congelados?", revisa
  relationshipStatus:
  - FROZEN_DISPUTE => hay disputa abierta y los activos están congelados.
  - DISSOLVED => la relación se disolvió y los activos pudieron ser
    transferidos o confiscados.
  - ACTIVE => no hay disputa activa; revisa otras posibles causas pero no
    inventes reglas.
- Si pregunta "¿Por qué no puedo comprar NFTs?", revisa hasActivePrenup y
  relationshipStatus:
  - Sin contrato ACTIVO => no puede crear NFTs de pareja.
  - FROZEN_DISPUTE => activos congelados por disputa.
- Si pregunta "¿Qué acepté en los 5 puntos de consentimiento?", resume los 5
  puntos de consentimiento en español claro.
- No prometas bypass de las reglas ni sugerencias para evadirlas.
`;

// Nombre del modelo local a usar con WebLLM (cuando se integre realmente)
const LOCAL_MODEL_NAME = 'Phi-3-mini';

export class LocalLegalAIWorker {
  private isReady = false;
  private onProgress?: (p: LoadProgress) => void;

  constructor(opts?: { onProgress?: (p: LoadProgress) => void }) {
    this.onProgress = opts?.onProgress;
  }

  private report(stage: LoadProgress['stage'], percent: number, message?: string) {
    this.onProgress?.({ stage, percent, message });
  }

  /**
   * Carga del modelo local.
   *
   * NOTA: Esta implementación es un stub seguro. Para producción se debe
   * integrar @mlc-ai/web-llm aquí, respetando su API oficial.
   */
  async loadModel(): Promise<void> {
    if (this.isReady) return;

    // Simulación de progreso para la UI
    this.report('initializing', 5, 'Inicializando motor de IA local...');
    await new Promise(resolve => setTimeout(resolve, 300));

    this.report('downloading', 40, `Descargando modelo local ${LOCAL_MODEL_NAME}...`);
    await new Promise(resolve => setTimeout(resolve, 700));

    this.report('warming_up', 80, 'Calentando modelo local...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Aquí debería inicializarse el engine real de WebLLM, por ejemplo:
    // import { CreateMLCEngine } from '@mlc-ai/web-llm';
    // this.engine = await CreateMLCEngine({ model: LOCAL_MODEL_NAME }, {...});

    this.isReady = true;
    this.report('ready', 100, 'Modelo local listo.');
  }

  /**
   * Genera una respuesta basada en el estado legal actual.
   * Mientras no se integre WebLLM real, las respuestas son determinísticas
   * y seguras, usando sólo runtimeState.
   */
  async generate({ userMessage, runtimeState }: GenerateParams): Promise<string> {
    if (!this.isReady) {
      await this.loadModel();
    }

    const lower = userMessage.toLowerCase();

    // Preguntas sobre congelamiento de activos
    if (lower.includes('activos') && lower.includes('congel')) {
      if (!runtimeState) {
        return 'Tus activos pueden estar sujetos a congelamiento si existe una disputa de pareja abierta o si tu contrato no está activo. Revisa el estado de tu acuerdo y de la Zona de Peligro.';
      }

      if (!runtimeState.hasActivePrenup) {
        return 'Tus activos pueden estar limitados porque aún no tienes un Acuerdo Prenupcial ACTIVO. Sin ese contrato, ciertas funciones de pareja se bloquean automáticamente.';
      }

      if (runtimeState.relationshipStatus === 'FROZEN_DISPUTE') {
        return 'Tus activos están congelados porque hay una disputa de pareja abierta. Durante una disputa (FROZEN_DISPUTE), los CMPX/GTK y NFTs compartidos no pueden moverse hasta que se registre una resolución.';
      }

      if (runtimeState.relationshipStatus === 'DISSOLVED') {
        return 'La relación de pareja se encuentra en estado DISUELTO (DISSOLVED). Es posible que los activos hayan sido transferidos o confiscados según el protocolo de crisis. Revisa el historial de disputas y el acuerdo vigente.';
      }

      return 'Según el estado actual, tu contrato está activo y no hay disputa registrada. Si ves activos congelados, revisa las reglas de staking o los límites operativos de tu wallet.';
    }

    // Preguntas sobre compra de NFTs
    if (lower.includes('no puedo comprar nft') || lower.includes('no puedo comprar nfts') || lower.includes('no puedo crear nft')) {
      if (!runtimeState) {
        return 'Para crear o comprar NFTs de pareja se requiere un Contrato Prenupcial ACTIVO. Si además existe una disputa abierta, los activos permanecen congelados hasta su resolución.';
      }

      if (!runtimeState.hasActivePrenup) {
        return 'No puedes comprar o crear NFTs de pareja porque aún no tienes un Acuerdo Prenupcial ACTIVO. Ambos miembros deben firmar digitalmente el contrato antes de habilitar estas funciones.';
      }

      if (runtimeState.relationshipStatus === 'FROZEN_DISPUTE') {
        return 'No puedes comprar o crear NFTs de pareja porque tu relación está en estado de disputa (FROZEN_DISPUTE). Los activos se congelan mientras la disputa esté abierta.';
      }

      if (runtimeState.relationshipStatus === 'DISSOLVED') {
        return 'No puedes operar NFTs de pareja porque la relación se encuentra en estado DISUELTO (DISSOLVED). Debes crear un nuevo acuerdo de pareja si deseas volver a utilizar estas funciones.';
      }

      return 'Tu contrato de pareja está activo y no se detecta una disputa abierta. Si sigues sin poder comprar NFTs, revisa los requisitos técnicos de la wallet o posibles límites internos de la plataforma.';
    }

    // Preguntas sobre los 5 puntos de consentimiento
    if (lower.includes('5 puntos') || lower.includes('cinco puntos') || lower.includes('que acepte') || lower.includes('qué acepté')) {
      return 'En el Acuerdo Prenupcial aceptaste cinco puntos clave: ' +
        '1) Firma Digital Vinculante: tu firma electrónica (IP + hash de sesión) tiene validez legal plena. ' +
        '2) Cláusula de Muerte Súbita: si hay disputa y no hay acuerdo en 30 días, los tokens involucrados pueden ser confiscados o quemados. ' +
        '3) Propiedad Proindiviso: los NFTs y CMPX generados en modo pareja son de ambos y no se pueden retirar unilateralmente. ' +
        '4) Registro de Evidencia: se registra IP, Timestamp y Dispositivo como evidencia pericial. ' +
        '5) Protocolo de Congelación: cualquier disputa o indicio de fraude congela inmediatamente los activos hasta la resolución.';
    }

    // Fallback genérico (sin modelo WebLLM real todavía)
    return 'Soy el auditor legal de Cómplices. Puedo explicarte por qué ciertas acciones (staking, compra de NFTs de pareja, desbloqueo de galería) están bloqueadas según tu contrato y el estado de disputas. ' +
      'Pregúntame, por ejemplo: "¿Por qué mis activos están congelados?" o "¿Qué acepté en los 5 puntos de consentimiento?".';
  }
}
