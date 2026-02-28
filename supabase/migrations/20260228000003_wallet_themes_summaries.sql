-- Migración para Tablas de Wallet, Themes y Chat Summaries
-- Fecha: 28 Feb 2026

-- 1. Wallet Balances (si no existe)
CREATE TABLE IF NOT EXISTS public.wallet_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance_cmpx DECIMAL(18, 2) DEFAULT 0.00,
    balance_gtk DECIMAL(18, 2) DEFAULT 0.00,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- 2. Token Transactions (si no existe)
CREATE TABLE IF NOT EXISTS public.token_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(18, 2) NOT NULL,
    token_type TEXT NOT NULL CHECK (token_type IN ('CMPX', 'GTK')),
    transaction_type TEXT NOT NULL, -- 'purchase', 'reward', 'spend', 'transfer'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. User Themes (si no existe)
CREATE TABLE IF NOT EXISTS public.user_themes (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_config JSONB NOT NULL DEFAULT '{"theme": "dark", "primaryColor": "#ff0080"}'::jsonb,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Chat Summaries (si no existe)
CREATE TABLE IF NOT EXISTS public.chat_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    key_points JSONB DEFAULT '[]'::jsonb,
    sentiment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Summary Requests (si no existe)
CREATE TABLE IF NOT EXISTS public.summary_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Agregar columna 'role' a profiles si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- RLS Policies
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summary_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para Wallet Balances
CREATE POLICY "Users can view own wallet balance" ON public.wallet_balances FOR SELECT USING (auth.uid() = user_id);

-- Políticas para Token Transactions
CREATE POLICY "Users can view own transactions" ON public.token_transactions FOR SELECT USING (auth.uid() = user_id);

-- Políticas para User Themes
CREATE POLICY "Users can view and update own theme" ON public.user_themes FOR ALL USING (auth.uid() = user_id);

-- Políticas para Chat Summaries (usuarios en el chat pueden ver el resumen)
CREATE POLICY "Chat participants can view summaries" ON public.chat_summaries FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.chat_rooms cr 
        -- Aquí asumo una tabla de participantes si existiera, o check de chat_room_id
        WHERE cr.id = chat_summaries.chat_room_id
    )
);

-- Políticas para Summary Requests
CREATE POLICY "Users can manage own summary requests" ON public.summary_requests FOR ALL USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallet_balances_updated_at BEFORE UPDATE ON public.wallet_balances FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_themes_updated_at BEFORE UPDATE ON public.user_themes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_summary_requests_updated_at BEFORE UPDATE ON public.summary_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
