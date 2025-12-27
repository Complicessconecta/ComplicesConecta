/**
 * Test de integraciÃ³n para verificar que los servicios funcionan con datos reales de Supabase
 * Este archivo puede ser ejecutado para probar la funcionalidad bÃ¡sica de cada servicio
 */

import { logger } from '@/lib/logger';
import { TokenAnalyticsService } from './TokenAnalyticsService';
import { postsService } from './postsService';
import { securityService } from './SecurityService';
import { coupleProfilesService } from '@/services/couple/CoupleProfilesService';
import { referralTokensService } from './ReferralTokensService';
import { invitationsService } from './InvitationsService';

class IntegrationTester {
  private results: Array<{
    service: string;
    test: string;
    success: boolean;
    error?: string;
    duration: number;
  }> = [];

  async runAllTests(): Promise<void> {
    logger.info('ðŸš€ Iniciando tests de integraciÃ³n con Supabase...');

    // Test TokenAnalyticsService
    await this.testTokenAnalyticsService();
    
    // Test PostsService
    await this.testPostsService();
    
    // Test SecurityService
    await this.testSecurityService();
    
    // Test CoupleProfilesService
    await this.testCoupleProfilesService();
    
    // Test ReferralTokensService
    await this.testReferralTokensService();
    
    // Test InvitationsService
    await this.testInvitationsService();

    // Mostrar resultados
    this.showResults();
  }

  private async testTokenAnalyticsService(): Promise<void> {
    logger.info('ðŸ“Š Probando TokenAnalyticsService...');
    
    const service = TokenAnalyticsService.getInstance();
    
    // Test 1: Generar mÃ©tricas actuales
    await this.runTest('TokenAnalyticsService', 'generateCurrentMetrics', async () => {
      const result = await service.generateCurrentMetrics();
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      logger.debug('  âœ… MÃ©tricas generadas', { metrics: result.metrics });
    });

    // Test 2: Obtener analytics histÃ³ricos
    await this.runTest('TokenAnalyticsService', 'getHistoricalAnalytics', async () => {
      const result = await service.getHistoricalAnalytics('daily', 5);
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      logger.debug('  âœ… Analytics histÃ³ricos obtenidos', { count: result.analytics?.length || 0 });
    });
  }

  private async testPostsService(): Promise<void> {
    logger.info('ðŸ“ Probando PostsService...');
    
    // Test 1: Obtener feed
    await this.runTest('PostsService', 'getFeed', async () => {
      const posts = await postsService.getFeed(0, 5);
      logger.debug('  âœ… Feed obtenido', { count: posts.length });
    });

    // Test 2: Obtener comentarios (si hay posts)
    await this.runTest('PostsService', 'getComments', async () => {
      const posts = await postsService.getFeed(0, 1);
      if (posts.length > 0) {
        const comments = await postsService.getComments(posts[0].id, 0, 5);
        logger.debug('  âœ… Comentarios obtenidos', { count: comments.length });
      } else {
        logger.debug('  âš ï¸ No hay posts para probar comentarios');
      }
    });
  }

  private async testSecurityService(): Promise<void> {
    logger.info('ðŸ›¡ï¸ Probando SecurityService...');
    
    const testUserId = 'test-user-id';
    
    // Test 1: Obtener logs de auditorÃ­a
    await this.runTest('SecurityService', 'getAuditLogs', async () => {
      const result = await securityService.getAuditLogs(testUserId, 5);
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      logger.debug('  âœ… Logs de auditorÃ­a obtenidos', { count: result.logs?.length || 0 });
    });

    // Test 2: Analizar actividad del usuario
    await this.runTest('SecurityService', 'analyzeUserActivity', async () => {
      const result = await securityService.analyzeUserActivity(testUserId, 'day');
      logger.debug('  âœ… AnÃ¡lisis de actividad completado', { riskLevel: result.riskLevel });
    });
  }

  private async testCoupleProfilesService(): Promise<void> {
    logger.info('ðŸ‘« Probando CoupleProfilesService...');
    
    // Test 1: Obtener perfiles de parejas cercanas (usa tabla real couple_profiles)
    await this.runTest('CoupleProfilesService', 'getNearbyCouples', async () => {
      const profiles = await coupleProfilesService.getNearbyCouples(0, 0, 50, 5);
      logger.debug('  âœ… Perfiles de parejas obtenidos', { count: profiles.length });
    });

    // Test 2: Obtener detalle de un perfil (usa getCoupleProfile sobre un ID real)
    await this.runTest('CoupleProfilesService', 'getCoupleProfile', async () => {
      const profiles = await coupleProfilesService.getNearbyCouples(0, 0, 50, 1);
      if (profiles.length === 0) {
        logger.debug('  âš ï¸ No hay perfiles de pareja para probar getCoupleProfile');
        return;
      }

      const profile = await coupleProfilesService.getCoupleProfile(profiles[0].id);
      logger.debug('  âœ… Perfil de pareja obtenido', { id: profile?.id || profiles[0].id });
    });
  }

  private async testReferralTokensService(): Promise<void> {
    logger.info('ðŸŽ Probando ReferralTokensService...');
    
    const testUserId = 'test-user-id';
    
    // Test 1: Generar cÃ³digo de referido
    await this.runTest('ReferralTokensService', 'generateReferralCode', async () => {
      const code = await referralTokensService.generateReferralCode(testUserId);
      logger.debug('  âœ… CÃ³digo de referido generado', { code });
    });

    // Test 2: Obtener balance de referidos
    await this.runTest('ReferralTokensService', 'getUserReferralBalance', async () => {
      const balance = await referralTokensService.getUserReferralBalance(testUserId);
      if (balance) {
        logger.debug('  âœ… Balance obtenido', { referralCode: balance.referral_code });
      } else {
        logger.debug('  âš ï¸ No se pudo obtener balance (puede ser normal si no existe)');
      }
    });
  }

  private async testInvitationsService(): Promise<void> {
    logger.info('ðŸ“§ Probando InvitationsService...');
    
    // Test 1: Obtener invitaciones del usuario
    await this.runTest('InvitationsService', 'getUserInvitations', async () => {
      const invitations = await invitationsService.getUserInvitations(0, 5);
      logger.debug('  âœ… Invitaciones obtenidas', { count: invitations.length });
    });

    // Test 2: Obtener plantillas de invitaciÃ³n
    await this.runTest('InvitationsService', 'getInvitationTemplates', async () => {
      const templates = await invitationsService.getInvitationTemplates();
      logger.debug('  âœ… Plantillas obtenidas', { count: templates.length });
    });
  }

  private async runTest(service: string, testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        service,
        test: testName,
        success: true,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        service,
        test: testName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
    }
  }

  private showResults(): void {
    const successfulTests = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    const successRate = (successfulTests / totalTests) * 100;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    logger.info('ðŸ“‹ RESULTADOS DE TESTS DE INTEGRACIÃ“N', {
      successful: successfulTests,
      total: totalTests,
      successRate: `${successRate.toFixed(1)}%`,
      totalDuration: `${totalDuration}ms`
    });

    // Mostrar detalles por servicio
    const services = [...new Set(this.results.map(r => r.service))];
    
    services.forEach(service => {
      const serviceResults = this.results.filter(r => r.service === service);
      const serviceSuccess = serviceResults.filter(r => r.success).length;
      const serviceTotal = serviceResults.length;
      
      logger.info(`${service}:`, {
        success: serviceSuccess,
        total: serviceTotal,
        results: serviceResults.map(r => ({
          test: r.test,
          success: r.success,
          duration: `${r.duration}ms`,
          error: r.error
        }))
      });
    });

    if (successRate === 100) {
      logger.info('ðŸŽ‰ Â¡Todos los tests pasaron exitosamente!');
      logger.info('ðŸš€ Los servicios estÃ¡n listos para usar con datos reales de Supabase.');
    } else if (successRate >= 80) {
      logger.warn('âš ï¸ La mayorÃ­a de tests pasaron. Revisar los fallos antes de producciÃ³n.');
    } else {
      logger.error('âŒ Varios tests fallaron. Revisar la configuraciÃ³n de Supabase.');
    }
  }
}

// FunciÃ³n para ejecutar los tests
export async function runIntegrationTests(): Promise<void> {
  const tester = new IntegrationTester();
  await tester.runAllTests();
}

// Ejecutar tests si se llama directamente
if (typeof window === 'undefined') {
  runIntegrationTests().catch((error) => {
    logger.error('Error ejecutando tests de integraciÃ³n:', { error });
  });
}

export default IntegrationTester;

