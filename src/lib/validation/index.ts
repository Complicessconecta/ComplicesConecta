/**
 * Barrel file para validación
 * Import paths estables para migración futura
 */

export { validateEmail, validateAge, validateCoupleAge } from '@/lib/validation';
export * from '@/lib/validation/zod/zod-schemas';
export * from '@/lib/visual-validation';
