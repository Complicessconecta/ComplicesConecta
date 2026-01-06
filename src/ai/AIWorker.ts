// src/ai/AIWorker.ts
// Motor de IA local (WebLLM / Phi-3-mini)

// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------

import { CreateMLCEngine } from "@mlc-ai/web-llm";
export type RelationshipStatus = "ACTIVE" | "FROZEN_DISPUTE" | "DISSOLVED";

export interface LegalRuntimeState {
  hasActivePrenup: boolean;
  relationshipStatus: RelationshipStatus;
}

export interface LoadProgress {
  stage:
    | "idle"
    | "initializing"
    | "downloading"
    | "warming_up"
    | "ready"
    | "error";
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

// Nombre del modelo local a usar con WebLLM
// Nota: este identificador debe existir en la configuración de modelos de WebLLM
// y puede ajustarse según la versión instalada.
const LOCAL_MODEL_NAME = "Phi-3-mini-4k-instruct-q4f16_1-MLC";

export class LocalLegalAIWorker {
  private isReady = false;
  private onProgress?: (p: LoadProgress) => void;
  // Motor de WebLLM (tipado laxo para evitar problemas con versiones futuras)
  private engine: any | null = null;

  constructor(opts?: { onProgress?: (p: LoadProgress) => void }) {
    this.onProgress = opts?.onProgress;
  }

  private report(
    stage: LoadProgress["stage"],
    percent: number,
    message?: string,
  ) {
    this.onProgress?.({ stage, percent, message });
  }

  /**
   * Carga del modelo local.
   */
  async loadModel(): Promise<void> {
    if (this.isReady) return;

    this.report("initializing", 5, "Inicializando motor de IA local...");

    // Inicializar motor de WebLLM con callback de progreso real
    try {
      this.engine = await CreateMLCEngine(LOCAL_MODEL_NAME, {
        initProgressCallback: (update: { progress: number; text: string }) => {
          const percent = Math.round(update.progress * 100);
          // Heurística simple para mapear texto de progreso a etapas
          if (percent < 40) {
            this.report("downloading", Math.max(percent, 10), update.text);
          } else if (percent < 80) {
            this.report("warming_up", Math.max(percent, 40), update.text);
          } else {
            this.report("warming_up", Math.max(percent, 80), update.text);
          }
        },
      });

      this.isReady = true;
      this.report("ready", 100, "Modelo local listo.");
    } catch (error) {
      console.error("Error inicializando WebLLM:", error);
      this.report("error", 100, "Error inicializando modelo local");
      // Dejamos isReady en false para que la UI sepa que hubo un fallo
    }
  }

  /**
   * Genera una respuesta basada en el estado legal actual.
   * Mientras no se integre WebLLM real, las respuestas son determinísticas
   * y seguras, usando sólo runtimeState.
   */
  async generate({
    userMessage,
    runtimeState,
  }: GenerateParams): Promise<string> {
    if (!this.isReady) {
      await this.loadModel();
    }

    const lower = userMessage.toLowerCase();

    // Preguntas sobre congelamiento de activos
    if (lower.includes("activos") && lower.includes("congel")) {
      if (!runtimeState) {
        return "Tus activos pueden estar sujetos a congelamiento si existe una disputa de pareja abierta o si tu contrato no está activo. Revisa el estado de tu acuerdo y de la Zona de Peligro.";
      }

      if (!runtimeState.hasActivePrenup) {
        return "Tus activos pueden estar limitados porque aún no tienes un Acuerdo Prenupcial ACTIVO. Sin ese contrato, ciertas funciones de pareja se bloquean automáticamente.";
      }

      if (runtimeState.relationshipStatus === "FROZEN_DISPUTE") {
        return "Tus activos están congelados porque hay una disputa de pareja abierta. Durante una disputa (FROZEN_DISPUTE), los CMPX/GTK y NFTs compartidos no pueden moverse hasta que se registre una resolución.";
      }

      if (runtimeState.relationshipStatus === "DISSOLVED") {
        return "La relación de pareja se encuentra en estado DISUELTO (DISSOLVED). Es posible que los activos hayan sido transferidos o confiscados según el protocolo de crisis. Revisa el historial de disputas y el acuerdo vigente.";
      }

      return "Según el estado actual, tu contrato está activo y no hay disputa registrada. Si ves activos congelados, revisa las reglas de staking o los límites operativos de tu wallet.";
    }

    // Preguntas sobre compra de NFTs
    if (
      lower.includes("no puedo comprar nft") ||
      lower.includes("no puedo comprar nfts") ||
      lower.includes("no puedo crear nft")
    ) {
      if (!runtimeState) {
        return "Para crear o comprar NFTs de pareja se requiere un Contrato Prenupcial ACTIVO. Si además existe una disputa abierta, los activos permanecen congelados hasta su resolución.";
      }

      if (!runtimeState.hasActivePrenup) {
        return "No puedes comprar o crear NFTs de pareja porque aún no tienes un Acuerdo Prenupcial ACTIVO. Ambos miembros deben firmar digitalmente el contrato antes de habilitar estas funciones.";
      }

      if (runtimeState.relationshipStatus === "FROZEN_DISPUTE") {
        return "No puedes comprar o crear NFTs de pareja porque tu relación está en estado de disputa (FROZEN_DISPUTE). Los activos se congelan mientras la disputa esté abierta.";
      }

      if (runtimeState.relationshipStatus === "DISSOLVED") {
        return "No puedes operar NFTs de pareja porque la relación se encuentra en estado DISUELTO (DISSOLVED). Debes crear un nuevo acuerdo de pareja si deseas volver a utilizar estas funciones.";
      }

      return "Tu contrato de pareja está activo y no se detecta una disputa abierta. Si sigues sin poder comprar NFTs, revisa los requisitos técnicos de la wallet o posibles límites internos de la plataforma.";
    }

    // Preguntas sobre los 5 puntos de consentimiento
    if (
      lower.includes("5 puntos") ||
      lower.includes("cinco puntos") ||
      lower.includes("que acepte") ||
      lower.includes("qué acepté")
    ) {
      return (
        "En el Acuerdo Prenupcial aceptaste cinco puntos clave: " +
        "1) Firma Digital Vinculante: tu firma electrónica (IP + hash de sesión) tiene validez legal plena. " +
        "2) Cláusula de Muerte Súbita: si hay disputa y no hay acuerdo en 30 días, los tokens involucrados pueden ser confiscados o quemados. " +
        "3) Propiedad Proindiviso: los NFTs y CMPX generados en modo pareja son de ambos y no se pueden retirar unilateralmente. " +
        "4) Registro de Evidencia: se registra IP, Timestamp y Dispositivo como evidencia pericial. " +
        "5) Protocolo de Congelación: cualquier disputa o indicio de fraude congela inmediatamente los activos hasta la resolución."
      );
    }

    // Fallback genérico: delegar al modelo Phi-3-mini vía WebLLM usando el prompt de sistema
    try {
      if (!this.engine) {
        // Si no hay engine disponible, caer al texto fijo
        throw new Error("Engine WebLLM no inicializado");
      }

      const response = await this.engine.chat.completions.create({
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT + "\n" + MASTER_CONTEXT_SUMMARY,
          },
          { role: "user", content: userMessage },
        ],
        stream: false,
        temperature: 0.2,
        max_tokens: 256,
      });

      const content =
        response?.choices?.[0]?.message?.content ??
        "No pude generar una respuesta con el modelo local, intenta reformular tu pregunta.";

      if (typeof content === "string") {
        return content.trim();
      }

      return "He recibido tu pregunta, pero no pude generar una respuesta estructurada con el modelo local. Intenta hacer tu pregunta de forma más directa.";
    } catch (error) {
      console.error("Error generando respuesta con WebLLM:", error);
      return (
        "Soy el auditor legal de Cómplices. Puedo explicarte por qué ciertas acciones (staking, compra de NFTs de pareja, desbloqueo de galería) están bloqueadas según tu contrato y el estado de disputas. " +
        'Pregúntame, por ejemplo: "¿Por qué mis activos están congelados?" o "Qué acepté en los 5 puntos de consentimiento?".'
      );
    }
  }
}
