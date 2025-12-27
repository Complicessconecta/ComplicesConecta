# 📁 PROJECT STRUCTURE TREE - ComplicesConecta v3.8.0

**Última Actualización:** 26 de Diciembre, 2025
**Versión:** 3.8.0
**Estado:** ✅ **PRODUCTION READY - REFACTORED - 100% TYPE-SAFE**
**Puntuación:** 99/100 ✅ (Estructura: 100/100, Lógica: 100/100, Consistencia: 99/100)

### Estructura General del Monorepo

```
conecta-social-comunidad-main/
├── app-master-context.md         # Libro Maestro Legal & Tokens (fuente única de verdad para IA Local)
├── src/                          # Frontend React + TypeScript
│   ├── App.tsx                   # Componente raíz (MainLayout + UnifiedBackground + Global ChatFab)
│   ├── main.tsx                  # Punto de entrada Vite/React
│   ├── index.css                 # Estilos globales principales
│   ├── vite-env.d.ts             # Tipos de entorno Vite
│   ├── assets/                   # Recursos estáticos
│   │   └── svg/                  # SVGs estandarizados (tokens, wallet, flows)
│   ├── ai/                       # Motor de IA Local (WebLLM + prompts legales)
│   │   ├── AIWorker.ts           # LocalLegalAIWorker (WebLLM + Phi-3-mini)
│   │   └── useLocalAI.ts         # Hook React para gestionar mensajes y progreso de IA
│   ├── components/               # Componentes reutilizables
│   │   ├── ai/                   # Componentes de UI para IA
│   │   │   └── LegalChatBox.tsx  # Asistente IA Legal reutilizable (glassmorphism + loader 0–100%)
│   │   ├── chat/                 # Componentes de Chat (FAB + chat in-app)
│   │   │   └── ChatFab.tsx       # Botón flotante global de chat
│   │   ├── images/               # Componentes de imagen
│   │   │   └── ImageGallery.tsx  # Galería con blur de privacidad
│   │   ├── profiles/             # Componentes de perfil
│   │   │   ├── couple/           # Perfiles de pareja
│   │   │   │   └── ProfileCouple.tsx # Perfil pareja (NFTs + flujo legal de pareja)
│   │   │   └── single/           # Perfiles individuales
│   │   │       └── ProfileSingle.tsx # Perfil individual (Tokens + Privacy)
│   │   ├── tokens/               # Componentes de tokens
│   │   │   └── TokenDashboard.tsx # Dashboard de tokens (Demo + UI Plexus/Glass)
│   │   └── ui/                   # Componentes UI base (Shadcn/Custom)
│   ├── features/                 # Lógica reusable por feature
│   ├── hooks/                    # Custom React hooks
│   ├── pages/                    # Páginas principales
│   │   ├── TokensInfo.tsx        # Información de tokens (SVGs actualizados)
│   │   ├── TokensLegal.tsx       # Documentación legal de tokens + CTA a Centro de Control IA
│   │   ├── AIControlCenter.tsx   # Centro de Control IA (`/ai-help`) con IA Local WebLLM
│   │   └── ...
│   ├── services/                 # Servicios de negocio
│   ├── styles/                   # Estilos (index.css)
│   ├── tests/                    # Tests unitarios/e2e
│   └── types/                    # Tipos globales
├── supabase/                     # Backend Supabase
│   ├── functions/                # Edge Functions
│   └── migrations/               # Migraciones SQL
├── public/                       # Archivos públicos
├── docs/                         # Documentación adicional (activa)
├── docs-unified/                 # Documentación unificada
├── _archive/
│   └── docs_old/                 # Documentación histórica/legacy archivada
├── tests/                        # Suite de testing
├── COMPLICESCONECTA_PRESENTACION_PUBLICA.md # Presentación actualizada
├── CONTRIBUTING.md               # Guía de contribución
├── DIAGRAMAS_FLUJOS_v3.5.0.md    # Diagramas de flujo
├── RELEASE_NOTES_v3.8.0.md       # Notas de lanzamiento
├── README.md                     # README principal
├── project-structure-tree.md     # Este archivo
└── package.json                  # Dependencias y scripts
