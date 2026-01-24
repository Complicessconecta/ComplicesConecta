/**
 * Barrel file para validación
 * Import paths estables para migración futura
 */

export { validateEmail, validateAge, validateCoupleAge } from '@/lib/validation';
export * from '@/lib/zod-schemas';
export * from '@/lib/visual-validation';
