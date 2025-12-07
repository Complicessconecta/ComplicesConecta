import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consentVerificationService as svc } from '@/services/ConsentVerificationService'

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: null
  }
})

describe('ConsentVerificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('analyzeConsent should detect explicit consent', async () => {
    const analysis = await (svc as any).analyzeConsent('sí, de acuerdo', 'chat')
    expect(analysis.consentLevel).toBe('explicit')
    expect(analysis.confidence).toBeGreaterThan(50)
  })

  it('analyzeConsent should detect negative consent', async () => {
    const analysis = await (svc as any).analyzeConsent('no quiero, basta', 'chat')
    expect(analysis.consentLevel).toBe('negative')
  })

  it('should require confirmation for sensitive message types', async () => {
    const analysis = await (svc as any).analyzeConsent('te mando foto', 'chat', { messageType: 'image' })
    expect(analysis.requiresConfirmation).toBe(true)
  })

  it('verifyConsentBeforeSend should return fallback on error', async () => {
    const verify = await (svc as any).verifyConsentBeforeSend('u1', 'u2', 'mensaje', 'text')
    expect(verify).toBeDefined()
    expect(verify.verified).toBe(false)
  })

  it('saveVerification should not throw when supabase unavailable', async () => {
    const result = await (svc as any).saveVerification({
      messageId: '',
      userId: 'u1',
      recipientId: 'u2',
      analysis: {
        consentLevel: 'ambiguous',
        confidence: 50,
        keywords: [],
        context: 'chat',
        requiresConfirmation: true,
        suggestedAction: 'review',
        explanation: 'test',
        timestamp: new Date()
      },
      verified: false
    })
    expect(result.messageId).toBe('pending')
    expect(result.verified).toBe(false)
  })
})

