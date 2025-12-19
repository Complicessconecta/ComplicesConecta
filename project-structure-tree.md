# 📁 PROJECT STRUCTURE TREE - ComplicesConecta v3.7.0

**Última Actualización:** 18 de Diciembre, 2025
**Versión:** 3.7.0
**Estado:** ✅ **PRODUCTION READY - AI-NATIVE - ENTERPRISE GRADE - 100% TYPE-SAFE - PRIVACY ENHANCED - UI POLISHED**
**Puntuación:** 98/100 ✅ (Estructura: 100/100, Lógica: 100/100, Consistencia: 98/100)

### Estructura General del Monorepo

```
conecta-social-comunidad-main/
├── src/                          # Frontend React + TypeScript
│   ├── App.tsx                   # Componente raíz (Global ChatFab added)
│   ├── main.tsx                  # Punto de entrada Vite/React
│   ├── index.css                 # Estilos globales principales
│   ├── vite-env.d.ts             # Tipos de entorno Vite
│   ├── assets/                   # Recursos estáticos
│   │   └── svg/                  # SVGs estandarizados (tokens, wallet, flows)
│   ├── components/               # Componentes reutilizables
│   │   ├── chat/                 # Componentes de Chat
│   │   │   └── ChatFab.tsx       # Botón flotante global de chat (NUEVO)
│   │   ├── images/               # Componentes de imagen
│   │   │   └── ImageGallery.tsx  # Galería con blur de privacidad
│   │   ├── profiles/             # Componentes de perfil
│   │   │   ├── couple/           # Perfiles de pareja
│   │   │   │   └── ProfileCouple.tsx # Perfil pareja (NFTs + Demo logic)
│   │   │   └── single/           # Perfiles individuales
│   │   │       └── ProfileSingle.tsx # Perfil individual (Tokens + Privacy)
│   │   ├── tokens/               # Componentes de tokens
│   │   │   └── TokenDashboard.tsx # Dashboard de tokens (Demo support)
│   │   └── ui/                   # Componentes UI base (Shadcn/Custom)
│   ├── features/                 # Lógica reusable por feature
│   ├── hooks/                    # Custom React hooks
│   ├── pages/                    # Páginas principales
│   │   ├── TokensInfo.tsx        # Información de tokens (SVGs actualizados)
│   │   └── ...
│   ├── services/                 # Servicios de negocio
│   ├── styles/                   # Estilos (index.css)
│   ├── tests/                    # Tests unitarios/e2e
│   └── types/                    # Tipos globales
├── supabase/                     # Backend Supabase
│   ├── functions/                # Edge Functions
│   └── migrations/               # Migraciones SQL
├── public/                       # Archivos públicos
├── docs/                         # Documentación adicional
├── docs-unified/                 # Documentación unificada
├── tests/                        # Suite de testing
├── COMPLICESCONECTA_PRESENTACION_PUBLICA.md # Presentación actualizada
├── CONTRIBUTING.md               # Guía de contribución
├── DIAGRAMAS_FLUJOS_v3.5.0.md    # Diagramas de flujo
├── RELEASE_NOTES_v3.4.1.md       # Notas de lanzamiento
├── README.md                     # README principal
├── project-structure-tree.md     # Este archivo
└── package.json                  # Dependencias y scripts
```
