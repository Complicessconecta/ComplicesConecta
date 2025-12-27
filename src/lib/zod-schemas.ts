import { z } from 'zod';

// ===== ESQUEMAS DE VALIDACIÃ“N ZOD =====

// Esquema para ProfileCard con validaciÃ³n completa
export const ProfileCardSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1, 'Nombre es requerido').max(50, 'Nombre muy largo'),
  age: z.number().int().min(18, 'Edad mÃ­nima 18 aÃ±os').max(99, 'Edad mÃ¡xima 99 aÃ±os').optional(),
  location: z.string().max(100, 'UbicaciÃ³n muy larga').optional(),
  image: z.string().url('URL de imagen invÃ¡lida').optional(),
  interests: z.array(z.string()).max(10, 'MÃ¡ximo 10 intereses').optional(),
  bio: z.string().max(500, 'BiografÃ­a muy larga').optional(),
  isOnline: z.boolean().optional(),
  verified: z.boolean().optional(),
  accountType: z.literal('single').or(z.literal('couple')).optional(),
  // Campos especÃ­ficos para perfiles de pareja
  partner_name: z.string().max(50, 'Nombre de pareja muy largo').optional(),
  partner_age: z.number().int().min(18).max(99).optional(),
  partner_image: z.string().url().optional(),
  partner2_name: z.string().max(50).optional(),
  partner2_age: z.number().int().min(18).max(99).optional(),
  partner2_image: z.string().url().optional(),
});

export type ProfileCardProps = z.infer<typeof ProfileCardSchema>;

// Esquema para ThemeSelector con tipos estrictos
export const ThemeSelectorSchema = z.object({
  currentTheme: z.literal('elegant').or(z.literal('modern')).or(z.literal('vibrant')),
  onThemeChange: z.function(),
  disabled: z.boolean().optional(),
  showPreview: z.boolean().optional(),
  className: z.string().optional(),
});

export type ThemeSelectorProps = z.infer<typeof ThemeSelectorSchema>;

// Esquema para mensajes de chat
export const ChatMessageSchema = z.object({
  id: z.string().min(1, 'ID de mensaje requerido'),
  content: z.string().min(1, 'Contenido no puede estar vacÃ­o').max(1000, 'Mensaje muy largo'),
  type: z.literal('user').or(z.literal('assistant')).or(z.literal('system')),
  timestamp: z.date().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Esquema para validaciÃ³n de email
export const EmailValidationSchema = z.object({
  email: z.string()
    .email('Formato de email invÃ¡lido')
    .min(5, 'Email muy corto')
    .max(100, 'Email muy largo'),
  template: z.literal('welcome')
    .or(z.literal('confirmation'))
    .or(z.literal('reset-password'))
    .or(z.literal('invitation'))
    .optional(),
  variables: z.record(z.string(), z.string()).optional(),
});

export type EmailValidation = z.infer<typeof EmailValidationSchema>;

// Esquema para transacciones de tokens
export const TokenTransactionSchema = z.object({
  userId: z.string().uuid('ID de usuario invÃ¡lido'),
  tokenType: z.literal('cmpx').or(z.literal('gtk')),
  amount: z.number().int().min(1, 'Cantidad debe ser mayor a 0').max(10000, 'Cantidad muy alta'),
  transactionType: z.literal('referral_bonus')
    .or(z.literal('welcome_bonus'))
    .or(z.literal('world_id_bonus'))
    .or(z.literal('staking_reward'))
    .or(z.literal('premium_purchase'))
    .or(z.literal('beta_reward'))
    .or(z.literal('stake_tokens'))
    .or(z.literal('unstake_tokens'))
    .or(z.literal('manual_adjustment')),
  description: z.string().max(200, 'DescripciÃ³n muy larga').optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TokenTransaction = z.infer<typeof TokenTransactionSchema>;

// Esquema para staking
export const StakingSchema = z.object({
  userId: z.string().uuid('ID de usuario invÃ¡lido'),
  amount: z.number().int().min(10, 'Cantidad mÃ­nima para staking: 10 tokens').max(10000),
  duration: z.number().int().min(1, 'DuraciÃ³n mÃ­nima: 1 dÃ­a').max(365, 'DuraciÃ³n mÃ¡xima: 365 dÃ­as'),
  tokenType: z.literal('cmpx').or(z.literal('gtk')).default('cmpx'),
});

export type StakingRequest = z.infer<typeof StakingSchema>;

// Esquema para tabla staking_records
export const StakingRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  token_type: z.literal('cmpx').or(z.literal('gtk')),
  amount: z.number().int().positive(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  apy: z.number().min(0).max(100),
  status: z.literal('active').or(z.literal('completed')).or(z.literal('cancelled')),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export type StakingRecord = z.infer<typeof StakingRecordSchema>;

// ===== FUNCIONES DE VALIDACIÃ“N =====

/**
 * Valida props de ProfileCard con manejo de errores
 */
export function validateProfileCard(props: unknown): ProfileCardProps {
  try {
    return ProfileCardSchema.parse(props);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`ValidaciÃ³n ProfileCard fallÃ³: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Valida configuraciÃ³n de tema
 */
export function validateThemeSelector(props: unknown): ThemeSelectorProps {
  try {
    return ThemeSelectorSchema.parse(props);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`ValidaciÃ³n ThemeSelector fallÃ³: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Valida email y template
 */
export function validateEmail(data: unknown): EmailValidation {
  try {
    return EmailValidationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`ValidaciÃ³n Email fallÃ³: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Valida transacciÃ³n de tokens
 */
export function validateTokenTransaction(transaction: unknown): TokenTransaction {
  try {
    return TokenTransactionSchema.parse(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`ValidaciÃ³n TokenTransaction fallÃ³: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Valida solicitud de staking
 */
export function validateStaking(request: unknown): StakingRequest {
  try {
    return StakingSchema.parse(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`ValidaciÃ³n Staking fallÃ³: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Valida registro de staking
 */
export function validateStakingRecord(record: unknown): StakingRecord {
  try {
    return StakingRecordSchema.parse(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`ValidaciÃ³n StakingRecord fallÃ³: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Valida de forma segura sin lanzar errores
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  return { success: false, errors };
}

