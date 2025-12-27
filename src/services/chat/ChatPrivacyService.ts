import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/lib/logger'

type ChatRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface ChatRequest {
  id: string
  sender_id: string
  receiver_id: string
  message?: string
  status: ChatRequestStatus
  created_at: string
}

export type GalleryAccessRequest = ChatRequest

class ChatPrivacyService {
  async canChat(userId: string, otherUserId: string): Promise<boolean> {
    try {
      if (!supabase) return false
      const { data, error } = await (supabase as any)
        .from('chat_permissions' as any)
        .select('status')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('other_user_id', otherUserId)
        .maybeSingle()

      if (error) {
        logger.debug('canChat check failed', { error: error.message })
        return false
      }

      const status = (data as any)?.status as ChatRequestStatus | undefined
      return status === 'accepted'
    } catch (error) {
      logger.error('canChat error', { error: String(error) })
      return false
    }
  }

  async getChatRequest(userId: string, otherUserId: string): Promise<ChatRequest | null> {
    try {
      if (!supabase) return null
      const { data, error } = await (supabase as any)
        .from('chat_requests' as any)
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('other_user_id', otherUserId)
        .order('created_at', { ascending: false })
        .maybeSingle()

      if (error) {
        logger.debug('getChatRequest failed', { error: error.message })
        return null
      }
      return data as ChatRequest | null
    } catch (error) {
      logger.error('getChatRequest error', { error: String(error) })
      return null
    }
  }

  async requestChatPermission(senderId: string, receiverId: string, message: string): Promise<ChatRequest | null> {
    try {
      if (!supabase) return null
      const payload = {
        sender_id: senderId,
        receiver_id: receiverId,
        other_user_id: receiverId,
        message,
        status: 'pending' as ChatRequestStatus,
      }
      const { data, error } = await (supabase as any)
        .from('chat_requests' as any)
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data as ChatRequest
    } catch (error) {
      logger.error('requestChatPermission error', { error: String(error) })
      return null
    }
  }

  async hasGalleryAccess(ownerId: string, viewerId: string): Promise<boolean> {
    try {
      if (!supabase) return false
      const { data, error } = await (supabase as any)
        .from('gallery_access' as any)
        .select('status')
        .eq('owner_id', ownerId)
        .eq('viewer_id', viewerId)
        .maybeSingle()

      if (error) {
        logger.debug('hasGalleryAccess failed', { error: error.message })
        return false
      }
      const status = (data as any)?.status as ChatRequestStatus | undefined
      return status === 'accepted'
    } catch (error) {
      logger.error('hasGalleryAccess error', { error: String(error) })
      return false
    }
  }

  async requestGalleryAccess(viewerId: string, ownerId: string, message: string): Promise<GalleryAccessRequest | null> {
    try {
      if (!supabase) return null
      const payload = {
        viewer_id: viewerId,
        owner_id: ownerId,
        other_user_id: ownerId,
        message,
        status: 'pending' as ChatRequestStatus,
      }
      const { data, error } = await (supabase as any)
        .from('gallery_access_requests' as any)
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data as GalleryAccessRequest
    } catch (error) {
      logger.error('requestGalleryAccess error', { error: String(error) })
      return null
    }
  }
}

export const chatPrivacyService = new ChatPrivacyService()
export type { ChatPrivacyService }
