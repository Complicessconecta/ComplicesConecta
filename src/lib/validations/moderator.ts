import { z } from 'zod';

// ValidaciÃ³n para solicitud de moderador
export const moderatorRequestSchema = z.object({
  fullName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZÃ¡Ã©Ã­Ã³ÃºÃÃ‰ÃÃ“ÃšÃ±Ã‘\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  email: z.string()
    .email('Ingresa un email vÃ¡lido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  
  experience: z.string()
    .max(1000, 'La experiencia no puede exceder 1000 caracteres')
    .optional(),
  
  motivation: z.string()
    .min(50, 'La motivaciÃ³n debe tener al menos 50 caracteres')
    .max(2000, 'La motivaciÃ³n no puede exceder 2000 caracteres'),
  
  availability: z.string()
    .max(200, 'La disponibilidad no puede exceder 200 caracteres')
    .optional(),
  
  previousModeration: z.string()
    .max(1000, 'La experiencia previa no puede exceder 1000 caracteres')
    .optional(),
  
  agreeToTerms: z.boolean()
    .refine(val => val === true, 'Debes aceptar los tÃ©rminos y condiciones')
});

// ValidaciÃ³n para creaciÃ³n de moderador por admin
export const createModeratorSchema = z.object({
  email: z.string()
    .email('Ingresa un email vÃ¡lido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  
  fullName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZÃ¡Ã©Ã­Ã³ÃºÃÃ‰ÃÃ“ÃšÃ±Ã‘\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  permissions: z.array(z.string())
    .min(1, 'Debe seleccionar al menos un permiso')
    .optional()
});

// ValidaciÃ³n para acciones de moderaciÃ³n
export const moderationActionSchema = z.object({
  reportId: z.string()
    .uuid('ID de reporte invÃ¡lido'),
  
  action: z.enum(['approve', 'reject']),
  
  reason: z.string()
    .min(10, 'La razÃ³n debe tener al menos 10 caracteres')
    .max(500, 'La razÃ³n no puede exceder 500 caracteres'),
  
  suspensionDays: z.number()
    .min(0, 'Los dÃ­as de suspensiÃ³n no pueden ser negativos')
    .max(365, 'Los dÃ­as de suspensiÃ³n no pueden exceder 365')
    .optional()
});

// ValidaciÃ³n para reportes de usuarios
export const userReportSchema = z.object({
  reportedUserId: z.string()
    .uuid('ID de usuario invÃ¡lido'),
  
  reportType: z.enum([
    'harassment',
    'inappropriate_content',
    'fake_profile',
    'spam',
    'underage',
    'terms_violation'
  ]),
  
  reason: z.string()
    .min(10, 'La razÃ³n debe tener al menos 10 caracteres')
    .max(200, 'La razÃ³n no puede exceder 200 caracteres'),
  
  description: z.string()
    .max(1000, 'La descripciÃ³n no puede exceder 1000 caracteres')
    .optional()
});

// Tipos TypeScript derivados de los esquemas
export type ModeratorRequestInput = z.infer<typeof moderatorRequestSchema>;
export type CreateModeratorInput = z.infer<typeof createModeratorSchema>;
export type ModerationActionInput = z.infer<typeof moderationActionSchema>;
export type UserReportInput = z.infer<typeof userReportSchema>;

// FunciÃ³n helper para validar datos
export const validateModeratorRequest = (data: unknown) => {
  return moderatorRequestSchema.safeParse(data);
};

export const validateCreateModerator = (data: unknown) => {
  return createModeratorSchema.safeParse(data);
};

export const validateModerationAction = (data: unknown) => {
  return moderationActionSchema.safeParse(data);
};

export const validateUserReport = (data: unknown) => {
  return userReportSchema.safeParse(data);
};

