/**
 * Ãndice centralizado de componentes - ComplicesConecta v3.6.3
 * OrganizaciÃ³n y exportaciÃ³n centralizada de componentes principales
 */

// === COMPONENTES DE NAVEGACIÃ“N ===
export { default as HeaderNav } from './HeaderNav';
export { default as Navigation } from './Navigation';

// === COMPONENTES DECORATIVOS ===
export { DecorativeHearts } from './DecorativeHearts';

// === CONFIGURACIONES DE COMPONENTES ===
export const COMPONENTS_CONFIG = {
  // ConfiguraciÃ³n de animaciones
  ANIMATIONS: {
    DURATION: 300, // 300ms
    EASING: 'ease-in-out',
    STAGGER_DELAY: 50 // 50ms entre elementos
  },
  
  // ConfiguraciÃ³n de lazy loading
  LAZY_LOADING: {
    ROOT_MARGIN: '50px',
    THRESHOLD: 0.1
  },
  
  // ConfiguraciÃ³n de modales
  MODALS: {
    BACKDROP_BLUR: true,
    CLOSE_ON_ESCAPE: true,
    CLOSE_ON_BACKDROP_CLICK: true
  },
  
  // ConfiguraciÃ³n de toasts
  TOASTS: {
    DURATION: 4000, // 4 segundos
    MAX_VISIBLE: 3,
    POSITION: 'bottom-right' as const
  }
} as const;

