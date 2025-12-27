// ========================================
// INTERESES SEGUROS (Para registro inicial - no explÃ­citos)
// ========================================
export const SAFE_INTERESTS = [
  // Lifestyle y valores
  "Lifestyle Swinger", "Intercambio de Parejas", "Mentalidad Abierta", "Sin Prejuicios",
  "ComunicaciÃ³n Abierta", "Respeto Mutuo", "DiscreciÃ³n Total", "Ambiente Relajado",
  "Experiencias Nuevas", "Conexiones AutÃ©nticas", "DiversiÃ³n Adulta", "Aventuras Compartidas",
  
  // Niveles de experiencia
  "Parejas Experimentadas", "Principiantes Curiosos", "Explorando el Lifestyle",
  
  // Eventos y lugares (no explÃ­citos)
  "Fiestas TemÃ¡ticas", "Clubs Privados", "Eventos Lifestyle", "Lifestyle MÃ©xico", "Eventos Exclusivos",
  "Clubs Swinger MÃ©xico", "Fiestas Privadas CDMX", "Encuentros Guadalajara", "Eventos Monterrey",
  
  // SocializaciÃ³n y actividades
  "Reuniones Sociales", "Cenas TemÃ¡ticas", "CÃ³cteles Elegantes", "Viajes en Pareja",
  "Spa de Parejas", "Bienestar en Pareja", "Actividades en Pareja", "ConexiÃ³n de Parejas",
  
  // Ambiente y experiencias lifestyle
  "Ambiente Elegante", "MÃºsica Ambiente", "IluminaciÃ³n Intima", "Espacios Privados",
  "Ambiente Sofisticado", "Experiencias Sensuales", "Bienestar Integral", "Entretenimiento Adulto"
];

// ========================================
// INTERESES EXPLÃCITOS (Solo post-registro, en configuraciÃ³n)
// ========================================
export const EXPLICIT_INTERESTS = [
  // Modalidades de intercambio
  "Intercambio Suave", "Intercambio Completo", "Soft Swap", "Full Swap",
  "Terceras Personas", "Encuentros Grupales", "Encuentros Casuales",
  
  // DinÃ¡micas especÃ­ficas
  "FotografÃ­a Sensual", "Baile Sensual", "Masajes TÃ¡ntricos", "Experiencias TÃ¡ntricas",
  "Juegos Sensuales", "Jacuzzi Privado", "Ambiente Sensual",
  
  // Experiencias Ã­ntimas
  "Encuentros Ãntimos", "Reuniones Ãntimas", "Experiencias Sensuales", "Cenas Ãntimas",
  "Espacios Privados", "Libertad Sexual", "Intercambio Ãntimo", "ConexiÃ³n FÃ­sica",
  
  // Arte y expresiÃ³n adulta
  "FotografÃ­a ErÃ³tica", "Arte ErÃ³tico", "Literatura ErÃ³tica", "CÃ³cteles AfrodisÃ­acos",
  "Bienestar Adulto", "Entretenimiento Adulto", "Ambiente Seductor"
];

// Lista completa (para referencia y bÃºsqueda)
export const ALL_INTERESTS = [...SAFE_INTERESTS, ...EXPLICIT_INTERESTS];

// Mantener compatibilidad con cÃ³digo existente
export const lifestyleInterests = ALL_INTERESTS;

// CategorÃ­as para el registro automÃ¡tico con temÃ¡tica mexicana
export const interestCategories = {
  principiante: [
    "Principiantes Curiosos", "Mentalidad Abierta", "ComunicaciÃ³n Abierta", 
    "Respeto Mutuo", "Experiencias Nuevas", "Ambiente Relajado"
  ],
  intermedio: [
    "Lifestyle Swinger", "Eventos Lifestyle", "Fiestas TemÃ¡ticas",
    "Clubs Privados", "Conexiones AutÃ©nticas", "DiversiÃ³n Adulta", "Lifestyle MÃ©xico"
  ],
  experimentado: [
    "Intercambio de Parejas", "Parejas Experimentadas", 
    "Clubs Swinger MÃ©xico", "Eventos Exclusivos", "Sin Prejuicios", "Fiestas Privadas CDMX"
  ],
  terceras_personas: [
    "Aventuras Compartidas", "Reuniones Sociales", "Espacios Privados",
    "Cenas TemÃ¡ticas", "Viajes en Pareja", "ConexiÃ³n de Parejas"
  ]
};

// FunciÃ³n para obtener intereses automÃ¡ticos segÃºn el perfil con temÃ¡tica mexicana
export function getAutoInterests(
  userType: 'single' | 'couple', 
  experienceLevel: string = 'intermedio',
  gender?: 'male' | 'female'
): string[] {
  const baseInterests = interestCategories[experienceLevel as keyof typeof interestCategories] || interestCategories.intermedio;
  
  // Agregar intereses seguros segÃºn el tipo de usuario y gÃ©nero
  let additionalInterests: string[] = [];
  
  if (userType === 'couple') {
    // Intereses para parejas (ambos gÃ©neros)
    additionalInterests = [
      "Spa de Parejas", "Eventos Monterrey", "Viajes en Pareja",
      "ConexiÃ³n de Parejas", "Bienestar en Pareja", "Cenas TemÃ¡ticas"
    ];
  } else {
    // Intereses para singles segÃºn gÃ©nero
    if (gender === 'female') {
      additionalInterests = [
        "Ambiente Elegante", "Spa de Parejas", "Bienestar Integral",
        "IluminaciÃ³n Intima", "CÃ³cteles Elegantes", "Experiencias Sensuales"
      ];
    } else {
      additionalInterests = [
        "Eventos Lifestyle", "Clubs Swinger MÃ©xico", "Reuniones Sociales",
        "MÃºsica Ambiente", "Entretenimiento Adulto", "Espacios Privados"
      ];
    }
  }
  
  // Combinar y limitar a 8 intereses Ãºnicos
  const combined = [...new Set([...baseInterests, ...additionalInterests])];
  return combined.slice(0, 8);
}

