# Flujo y Lógica de Trabajo de Tokens CMPX & GTK

**Versión del Proyecto:** CómplicesConecta v3.6.6
**Fecha:** 24 de Enero, 2026
**Estado:** Beta (CMPX off-chain) → Producción (GTK blockchain)

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Tipos de Tokens](#tipos-de-tokens)
3. [Flujo de Trabajo CMPX](#flujo-de-trabajo-cmpx)
4. [Flujo de Trabajo GTK](#flujo-de-trabajo-gtk)
5. [Sistema de Recompensas](#sistema-de-recompensas)
6. [Casos de Uso](#casos-de-uso)
7. [Integración con IA](#integración-con-ia)
8. [Arquitectura Técnica](#arquitectura-técnica)
9. [Seguridad y Validaciones](#seguridad-y-validaciones)
10. [Roadmap Blockchain](#roadmap-blockchain)

---

## 🎯 Visión General

El sistema de tokens de CómplicesConecta implementa una **economía digital dual**:

- **CMPX:** Token interno para consumo dentro de la aplicación (off-chain durante beta)
- **GTK:** Token blockchain (ERC20) para staking e inversión (activado en producción)

### Propósito Principal

Los tokens sirven como:
- **Incentivo de participación:** Recompensas por referidos y actividad en la comunidad
- **Acceso a funciones premium:** Super likes, boosts, contenido exclusivo
- **Inversión y staking:** Generación de rewards pasivos
- **Medio de intercambio:** Compra de servicios virtuales dentro de la plataforma

---

## 💰 Tipos de Tokens

### CMPX (Complices Platform eXperience)

**Características:**
- **Tipo:** Token interno (off-chain durante beta)
- **Total Supply:** 1,000,000 CMPX
- **Estado:** Activo en fase beta
- **Transferibilidad:** No transferible durante beta
- **Conversión:** Se convertirá 1:1 a GTK en producción

**Funciones:**
- Recompensas por referidos
- Bienvenida de nuevos usuarios
- Compra de funciones premium
- Acceso a contenido exclusivo

### GTK (Governance Token Key)

**Características:**
- **Tipo:** Token blockchain (ERC20)
- **Total Supply:** 5,000,000 GTK
- **Estado:** Pausado (activación en producción)
- **Transferibilidad:** Transferible en blockchain
- **Red:** Polygon (L2 de Ethereum)

**Funciones:**
- Staking con APY competitivo (15-35%)
- Gobernanza del protocolo
- Liquidez en exchanges
- Inversión a largo plazo

---

## 🔄 Flujo de Trabajo CMPX

### 1. Adquisición de CMPX

#### A. Sistema de Referidos

```typescript
// Configuración de recompensas
const TOKEN_CONFIG = {
  REFERRAL_REWARD: 50,      // 50 CMPX por referido exitoso
  WELCOME_BONUS: 50,        // 50 CMPX por usar código de referido
  MONTHLY_LIMIT: 500,       // Límite mensual de ganancias
  RESET_DAY: 1,              // Reset el día 1 de cada mes
};
```

**Flujo:**
1. Usuario A genera código de referido único
2. Usuario B se registra con código de A
3. Sistema valida código y previene auto-referidos
4. Ambos usuarios reciben 50 CMPX
5. Sistema verifica límite mensual (max 500 CMPX)

**Validaciones:**
- Código de referido único y no expirado
- Usuario B no es auto-referido de A
- Usuario B no ha usado el código antes
- Usuario A no ha excedido límite mensual

#### B. Compra Directa

**Precios de compra (MXN):**

| Cantidad | Precio (MXN) | Descuento | Precio/Token |
|----------|---------------|-----------|--------------|
| 100 CMPX | $20 MXN       | 0%        | $0.20        |
| 500 CMPX | $90 MXN       | 10%       | $0.18        |
| 1,000 CMPX | $160 MXN     | 20%       | $0.16        |
| 2,500 CMPX | $350 MXN     | 30%       | $0.14        |
| 5,000 CMPX | $600 MXN     | 40%       | $0.12        |

**Flujo:**
1. Usuario selecciona paquete de CMPX
2. Sistema procesa pago (integración con pasarela)
3. Tokens se acreditan en wallet interna
4. Transacción se registra en base de datos

### 2. Uso de CMPX

#### A. Casos de Uso Principal

| Función | Costo (CMPX) | Descripción |
|---------|---------------|-------------|
| Super Like | 10 | Destaca like entre otros usuarios |
| Boost de Perfil | 50 | Aparece más en Discover por 24h |
| Regalo Virtual (Básico) | 50 | Flores, chocolates virtuales |
| Regalo Virtual (Premium) | 200 | Regalos personalizados |
| Regalo Virtual (Lujo) | 500 | Regalos premium con efectos |
| Video Llamada (15 min) | 75 | Sesión de video chat |
| Video Llamada (30 min) | 120 | Sesión extendida |
| Video Llamada (60 min) | 200 | Sesión premium |
| Evento VIP (Entrada) | 200 | Acceso a evento exclusivo |
| Evento VIP (Premium) | 500 | Acceso VIP con beneficios |
| Evento VIP (Lujo) | 1,000 | Acceso exclusivo total |
| Desbloquear Galería Privada | 100 | Acceso temporal a contenido |
| Chat Premium (30 días) | 100 | Mensajes ilimitados |
| Filtros Avanzados (30 días) | 75 | Búsquedas más precisas |
| Likes Ilimitados (30 días) | 50 | Sin límites diarios |

**Flujo de consumo:**
1. Usuario selecciona función premium
2. Sistema verifica balance suficiente
3. Si balance suficiente → Deduce CMPX
4. Desbloquea función premium
5. Registra transacción en historial
6. Si balance insuficiente → Muestra opción de compra

#### B. Límites y Restricciones

- **Límite mensual de ganancias:** 500 CMPX (reset día 1)
- **Sin límite de consumo:** Una vez adquiridos, no hay límite de uso
- **No transferibles:** CMPX no se pueden transferir entre usuarios
- **No reembolsables:** CMPX comprados no se pueden devolver

### 3. Gestión de Balance

**Interfaz TokenBalance:**
```typescript
interface TokenBalance {
  userId: string;
  cmpxBalance: number;      // Balance actual CMPX
  gtkBalance: number;       // Balance actual GTK (futuro)
  stakedAmount: number;     // Cantidad staked
  lastUpdated: string;      // Timestamp de última actualización
}
```

**Flujo de actualización:**
1. Cache local (5 minutos TTL)
2. Verificación en base de datos
3. Actualización de balance
4. Invalidación de cache
5. Notificación de cambio al usuario

---

## 🔗 Flujo de Trabajo GTK

### 1. Activación de GTK (Producción)

**Conversión CMPX → GTK:**
- Ratio 1:1 (1 CMPX = 1 GTK)
- Automática al migrar a blockchain
- Preserva historial de transacciones
- Mantiene ownership de tokens

**Smart Contracts:**
- Token ERC20 en Polygon
- Contratos de staking
- Contratos de rewards
- Sistema de gobernanza

### 2. Staking GTK

**Opciones de Staking:**

| Duración | APY | Mínimo | Penalidad |
|----------|-----|--------|-----------|
| 30 días   | 15% | 100 GTK | 5%        |
| 90 días   | 20% | 100 GTK | 5%        |
| 180 días  | 25% | 100 GTK | 5%        |
| 270 días  | 30% | 100 GTK | 5%        |
| 365 días  | 35% | 100 GTK | 5%        |

**Flujo de Staking:**
1. Usuario selecciona duración y cantidad
2. Sistema verifica balance GTK suficiente
3. Usuario aprueba transacción en wallet
4. Tokens se bloquean en smart contract
5. Rewards se calculan diariamente
6. Usuario puede unstake (con penalidad si es temprano)
7. Rewards se distribuyen automáticamente

**Cálculo de Rewards:**
```typescript
// Fórmula de rewards
const dailyReward = (stakedAmount * apy / 100) / 365;
const totalReward = dailyReward * daysStaked;
```

**Interfaz StakingRecommendation:**
```typescript
interface StakingRecommendation {
  userId: string;
  recommendedStake: number;    // Cantidad recomendada
  predictedAPY: number;        // APY predicho
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;            // Duración recomendada
  confidence: number;          // Confianza (0-1)
  reasoning: string;           // Explicación de IA
}
```

### 3. Distribución de GTK

**Total Supply:** 5,000,000 GTK

| Categoría | Porcentaje | Cantidad | Descripción |
|-----------|------------|----------|-------------|
| Venta Pública (ICO/IDO) | 40% | 2,000,000 | Inversores y usuarios tempranos |
| Staking Rewards Pool | 20% | 1,000,000 | Recompensas para stakers |
| Team y Desarrollo | 15% | 750,000 | Vesting 3 años |
| Liquidez en Exchanges | 10% | 500,000 | DEX/CEX para comercio |
| Marketing y Partnerships | 10% | 500,000 | Alianzas estratégicas |
| Reserva de Emergencias | 5% | 250,000 | Desarrollo futuro |

---

## 🎁 Sistema de Recompensas

### 1. Referidos

**Flujo completo:**

```
Usuario A (Referrer)
    ↓ Genera código único
    ↓ Comparte código con amigos
    ↓
Usuario B (Referee)
    ↓ Se registra con código
    ↓ Sistema valida código
    ↓
    ↓→ Usuario A recibe 50 CMPX
    ↓→ Usuario B recibe 50 CMPX
    ↓→ Ambos usuarios notificados
```

**Validaciones implementadas:**
- Código único por usuario
- Prevención de auto-referidos
- Verificación de IP (mismo IP = sospechoso)
- Límite mensual de 500 CMPX
- Historial de códigos usados
- Expiración de códigos (opcional)

### 2. Bienvenida

**Bonus de bienvenida:**
- 50 CMPX al usar código de referido válido
- Solo una vez por usuario
- Se acredita inmediatamente después de registro exitoso

### 3. World ID (Futuro)

**Integración planificada:**
- Verificación de identidad humana con Worldcoin
- 100 CMPX adicionales por verificar
- Tecnología blockchain para privacidad
- Prevención de bots y cuentas falsas

---

## 🎮 Casos de Uso

### 1. Super Like

**Flujo:**
1. Usuario ve perfil en Discover
2. Toca botón "Super Like" (icono corazón)
3. Sistema verifica balance (10 CMPX)
4. Si balance suficiente:
   - Deduce 10 CMPX
   - Notifica al usuario destinatario
   - Destaca like en su feed
5. Si balance insuficiente:
   - Muestra modal de compra
   - Ofrece paquetes de CMPX

### 2. Boost de Perfil

**Flujo:**
1. Usuario compra boost (50 CMPX)
2. Sistema activa boost por 24 horas
3. Perfil aparece más en Discover (algoritmo modificado)
4. Contador de impresiones incrementado
5. Al finalizar 24h:
   - Notifica usuario
   - Muestra estadísticas (vistas, likes, matches)

### 3. Regalos Virtuales

**Niveles de regalos:**
- **Básico (50 CMPX):** Flores, chocolates, corazones
- **Premium (200 CMPX):** Regalos personalizados
- **Lujo (500 CMPX):** Regalos con efectos especiales

**Flujo:**
1. Usuario selecciona regalo en chat
2. Sistema verifica balance
3. Si balance suficiente:
   - Deduce CMPX
   - Envía regalo en chat
   - Notifica destinatario
   - Registra en historial de regalos
4. Si balance insuficiente:
   - Muestra opción de compra

### 4. Video Llamadas

**Duraciones y costos:**
- 15 min: 75 CMPX
- 30 min: 120 CMPX
- 60 min: 200 CMPX

**Flujo:**
1. Usuario solicita videollamada
2. Sistema verifica balance
3. Si balance suficiente:
   - Deduce CMPX
   - Inicia videollamada
   - Registra duración
   - Si se termina temprano → Reembolso parcial
4. Si balance insuficiente:
   - Muestra opción de compra

### 5. Eventos VIP

**Niveles de acceso:**
- **Entrada (200 CMPX):** Acceso básico
- **Premium (500 CMPX):** Acceso + beneficios extra
- **Lujo (1,000 CMPX):** Acceso total + experiencias exclusivas

**Flujo:**
1. Usuario compra entrada
2. Sistema genera ticket único
3. Ticket se guarda en wallet
4. Al evento:
   - Escaneo de QR del ticket
   - Verificación de autenticidad
   - Acceso concedido

---

## 🤖 Integración con IA

### 1. TokenService

**Servicio principal para gestión de tokens:**

```typescript
class TokenService {
  private cache = new Map<string, any>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Obtener balance de tokens
  async getTokenBalance(userId: string): Promise<TokenBalance>

  // Generar recomendación de staking con IA
  async getStakingRecommendation(userId: string): Promise<StakingRecommendation>

  // Explicar transacción con IA
  async explainTransaction(
    transactionHash: string,
    transactionType: 'stake' | 'unstake' | 'transfer' | 'reward',
    amount: number,
    tokenType: 'CMPX' | 'GTK',
    userId: string
  ): Promise<TransactionExplanation>

  // Predecir uso de tokens con IA
  async predictTokenUsage(userId: string): Promise<TokenUsagePrediction>

  // Simular staking (en producción interactúa con contratos)
  async simulateStake(userId: string, amount: number): Promise<{
    success: boolean;
    transactionHash: string;
    newBalance: number;
    stakedAmount: number;
    estimatedAPY: number;
  }>
}
```

### 2. Predicción de Uso de Tokens

**Flujo de predicción:**

```typescript
async predictTokenUsage(userId: string): Promise<TokenUsagePrediction> {
  // 1. Obtener historial de uso
  const usageHistory = await this.getTokenUsageHistory(userId);

  // 2. Analizar comportamiento del usuario
  const behaviorProfile = await this.analyzeUserBehavior(usageHistory);

  // 3. Generar predicción con IA
  const prediction = await aiIntegrationService.predictTokenUsage(userId);

  // 4. Analizar factores de uso
  const factors = this.analyzeUsageFactors(usageHistory);

  return {
    userId,
    currentBalance: behaviorProfile.currentBalance,
    predictedUsage: prediction.predictedUsage,
    recommendedStake: prediction.recommendedStake,
    riskLevel: prediction.riskLevel,
    timeframe: prediction.timeframe,
    factors
  };
}
```

**Factores analizados:**
- Uso diario promedio
- Tendencia de consumo (creciente/decreciente/estable)
- Tipos de transacciones más frecuentes
- Patrones temporales (día/noche, semana/fin de semana)
- Actividad en staking

### 3. Recomendaciones de Staking con IA

**Prompt de IA:**
```
Analiza el siguiente perfil de usuario y genera una recomendación de staking:

Balance actual: {cmpxBalance} CMPX, {gtkBalance} GTK
Amount staked: {stakedAmount}
Historial de uso: {usageHistory}

Recomienda:
1. Cantidad óptima para staking
2. APY predicho (basado en condiciones del mercado)
3. Nivel de riesgo (low/medium/high)
4. Timeframe recomendado
5. Confianza en la recomendación (0-1)
6. Razón detallada

Responde en formato JSON.
```

**Salida esperada:**
```json
{
  "recommendedStake": 1000,
  "predictedAPY": 22.5,
  "riskLevel": "medium",
  "timeframe": "90d",
  "confidence": 0.85,
  "reasoning": "Basado en tu historial de uso moderado y tendencia creciente, recomiendo staking de 1000 GTK por 90 días con APY de 22.5%"
}
```

### 4. Explicación de Transacciones con IA

**Flujo:**
1. Usuario solicita explicación de transacción
2. Sistema construye prompt con detalles
3. IA genera explicación amigable
4. Sistema formatea respuesta
5. Explicación se muestra al usuario

**Ejemplo de prompt:**
```
Explica esta transacción de blockchain en términos simples para un usuario de CómplicesConecta:

Tipo: stake
Cantidad: 500 GTK
Hash: 0x123abc...

Explica:
1. Qué significa esta transacción
2. Cómo afecta al usuario
3. Cuáles son los próximos pasos si aplica

Sé claro, conciso y amigable. Máximo 100 palabras.
```

---

## 🏗️ Arquitectura Técnica

### 1. Servicios Principales

```
src/services/
├── tokens/
│   └── TokenService.ts          # Gestión de tokens y staking
├── ai/
│   └── AIIntegrationService.ts  # Predicciones y análisis con IA
└── analytics/
    └── TokenAnalyticsService.ts # Métricas y estadísticas
```

### 2. Base de Datos

**Tablas principales:**

```sql
-- Balances de tokens
CREATE TABLE token_balances (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  cmpx_balance DECIMAL(18, 2) DEFAULT 0,
  gtk_balance DECIMAL(18, 2) DEFAULT 0,
  staked_amount DECIMAL(18, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Historial de transacciones
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  transaction_type VARCHAR(50),
  amount DECIMAL(18, 2),
  token_type VARCHAR(10), -- 'CMPX' or 'GTK'
  transaction_hash VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Referidos
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  code VARCHAR(20) UNIQUE,
  uses_count INTEGER DEFAULT 0,
  monthly_reward DECIMAL(18, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Staking
CREATE TABLE staking_positions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(18, 2),
  apy DECIMAL(5, 2),
  duration_days INTEGER,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(20) -- 'active', 'completed', 'withdrawn'
);
```

### 3. Cache

**Estrategia de cache:**
- Balance: 5 minutos TTL
- Recomendaciones de staking: 10 minutos TTL
- Predicciones de uso: 15 minutos TTL
- Historial de transacciones: Sin cache (datos en tiempo real)

### 4. Integración Blockchain (Futuro)

**Smart Contracts:**
```
contracts/
├── GTKToken.sol          # Token ERC20
├── StakingContract.sol   # Staking y rewards
├── RewardDistributor.sol # Distribución de rewards
└── GovernanceToken.sol    # Gobernanza
```

**Interacción:**
- Web3.js / Ethers.js para conectar wallet
- Polygon network (L2)
- Gas optimization con Layer 2
- Eventos para tracking de transacciones

---

## 🔒 Seguridad y Validaciones

### 1. Validaciones de Referidos

**Prevención de abuso:**
- Auto-referidos: Verificar IP y device fingerprint
- Múltiples cuentas: Detección de patrones sospechosos
- Límites mensales: 500 CMPX por usuario
- Expiración de códigos: Opcional, configurable

**Validación de código:**
```typescript
async validateReferralCode(code: string, userId: string): Promise<boolean> {
  // 1. Verificar que el código existe
  const referral = await getReferralByCode(code);
  if (!referral) return false;

  // 2. Verificar que no es auto-referido
  if (referral.user_id === userId) return false;

  // 3. Verificar IP del usuario
  const userIP = await getUserIP(userId);
  const referrerIP = await getUserIP(referral.user_id);
  if (userIP === referrerIP) return false; // Sospechoso

  // 4. Verificar límite mensual
  const monthlyReward = await getMonthlyReward(referral.user_id);
  if (monthlyReward >= 500) return false;

  // 5. Verificar que el código no ha sido usado
  const used = await hasUserUsedCode(userId, code);
  if (used) return false;

  return true;
}
```

### 2. Validaciones de Transacciones

**Checks antes de cada transacción:**
1. Verificar balance suficiente
2. Verificar que el usuario es el propietario
3. Verificar que el token no está staked
4. Verificar límites de transacción
5. Registrar transacción en historial
6. Notificar al usuario

### 3. Seguridad de Smart Contracts

**Prácticas de seguridad:**
- Auditoría de contratos (Certik, OpenZeppelin)
- Pruebas exhaustivas (unit tests, integration tests)
- Time locks para cambios críticos
- Multi-sig para acciones administrativas
- Upgradeability pattern (proxy contracts)

### 4. Prevención de Ataques

**Ataques prevenidos:**
- **Replay attacks:** Nonces en transacciones
- **Front-running:** Commit-reveal scheme
- **Flash loan attacks:** Límites de retiro
- **Sybil attacks:** Verificación de identidad
- **51% attacks:** Descentralización de validators

---

## 🗺️ Roadmap Blockchain

### Fase 1: Beta (Actual)
- ✅ CMPX off-chain
- ✅ Sistema de referidos
- ✅ Casos de uso premium
- ✅ Integración con IA para predicciones
- ⏳ World ID integration (en desarrollo)

### Fase 2: Pre-Launch
- ⏳ Auditoría de smart contracts
- ⏳ Testnet deployment (Polygon Mumbai)
- ⏳ Beta testing con usuarios seleccionados
- ⏳ Documentación técnica completa
- ⏳ KYC/AML compliance

### Fase 3: Launch
- ⏳ Conversión CMPX → GTK (1:1)
- ⏳ Mainnet deployment (Polygon)
- ⏳ Liquidez en DEX (Uniswap)
- ⏳ Listing en CEX (Binance, Coinbase)
- ⏳ Marketing y community building

### Fase 4: Post-Launch
- ⏳ Gobernanza descentralizada (DAO)
- ⏳ Integración con otros protocolos DeFi
- ⏳ NFTs premium con beneficios GTK
- ⏳ Staking avanzado (yield farming)
- ⏳ Cross-chain bridges (Ethereum, BSC)

---

## 📊 Métricas y KPIs

### Métricas de Usuario

**Por usuario:**
- Balance promedio CMPX
- Frecuencia de uso de tokens
- Casos de uso más populares
- Tasa de conversión (CMPX → premium features)
- Retención de usuarios con tokens

### Métricas Globales

**Del ecosistema:**
- Total CMPX en circulación
- Total CMPX staked
- Distribución de tokens (Gini coefficient)
- Volumen de transacciones diarias
- Número de usuarios activos con tokens

### Métricas de Staking

**Cuando GTK esté activo:**
- Total GTK staked
- APY promedio
- Duración promedio de staking
- Número de stakers activos
- Tasa de unstake temprano

---

## 🎓 Conclusión

El sistema de tokens CMPX & GTK de CómplicesConecta implementa una economía digital robusta y escalable:

**CMPX (Beta):**
- Incentiva participación en la comunidad
- Facilita acceso a funciones premium
- Prepara usuarios para economía blockchain
- Integración con IA para personalización

**GTK (Producción):**
- Permite staking con APY competitivo
- Habilita gobernanza descentralizada
- Ofrece liquidez en exchanges
- Crea valor a largo plazo

**Integración con IA:**
- Predicciones personalizadas de uso
- Recomendaciones de staking inteligentes
- Explicaciones amigables de transacciones
- Análisis de comportamiento del usuario

**Seguridad:**
- Validaciones múltiples en referidos
- Prevención de abuso y fraudes
- Auditoría de smart contracts
- Cumplimiento de regulaciones

Este sistema está diseñado para escalar desde una economía off-chain en beta hasta una economía blockchain completa en producción, manteniendo siempre la mejor experiencia de usuario y seguridad.
