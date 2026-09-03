-- BIZZ-AI-OS: Sprint 1A Security & Row Level Security Migration
-- Version: 20260903000002
-- Scope: workspace_members, security functions, Row Level Security policies

-- ============================================================================
-- ARQUITETURA DE SEGURANÇA E BOOTSTRAP INICIAL
-- ============================================================================
-- 1. IDENTIDADE: Gerida pelo Supabase Auth (auth.users).
-- 2. CONTEXTO EMPRESARIAL: Ancorado no workspace_id.
-- 3. ASSOCIAÇÃO: Tabela associativa public.workspace_members (user_id <-> workspace_id).
-- 4. BOOTSTRAP INICIAL:
--    A primeira associação entre a conta criada no Supabase Auth e o Default Workspace
--    (00000000-0000-0000-0000-000000000001) é feita administrativamente via SQL Editor:
--    INSERT INTO public.workspace_members (workspace_id, user_id, role)
--    VALUES ('00000000-0000-0000-0000-000000000001', '<AUTH_USER_UUID>', 'owner');
--    Não existem políticas permissivas de auto-atribuição no frontend.
-- 5. INVARIANTE FUTURA:
--    Um workspace deve manter sempre pelo menos 1 membro com role = 'owner'.
-- ============================================================================

-- ==========================================
-- 1. TABELA WORKSPACE_MEMBERS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);

-- ==========================================
-- 2. FUNÇÕES DE SEGURANÇA (SECURITY DEFINER)
-- ==========================================

-- Função segura para verificar se o utilizador autenticado pertence ao workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
          AND user_id = (SELECT auth.uid())
    );
END;
$$;

-- Função segura para verificar se o utilizador autenticado é OWNER do workspace
CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
          AND user_id = (SELECT auth.uid())
          AND role = 'owner'
    );
END;
$$;

-- Restringir explicitamente a execução das funções de segurança
REVOKE ALL ON FUNCTION public.is_workspace_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_workspace_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_owner(UUID) TO authenticated, service_role;

-- ==========================================
-- 3. ATIVAR ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. POLÍTICAS RLS: WORKSPACES
-- ==========================================

-- Membros autenticados podem visualizar os seus workspaces
CREATE POLICY "Members can view their workspaces"
ON public.workspaces FOR SELECT
TO authenticated
USING (public.is_workspace_member(id));

-- Apenas o OWNER pode atualizar o workspace
CREATE POLICY "Owners can update their workspaces"
ON public.workspaces FOR UPDATE
TO authenticated
USING (public.is_workspace_owner(id))
WITH CHECK (public.is_workspace_owner(id));

-- Apenas o OWNER pode apagar o workspace
CREATE POLICY "Owners can delete their workspaces"
ON public.workspaces FOR DELETE
TO authenticated
USING (public.is_workspace_owner(id));

-- NOTA: Sem política de INSERT para workspaces nesta fase (apenas existe o Default Workspace).

-- ==========================================
-- 5. POLÍTICAS RLS: WORKSPACE_MEMBERS
-- ==========================================

-- Utilizadores podem consultar as suas próprias memberships e colegas do mesmo workspace
CREATE POLICY "Users can view members of their workspaces"
ON public.workspace_members FOR SELECT
TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR public.is_workspace_member(workspace_id)
);

-- Apenas o OWNER do workspace pode adicionar novos membros (sem auto-atribuição)
CREATE POLICY "Owners can insert workspace members"
ON public.workspace_members FOR INSERT
TO authenticated
WITH CHECK (public.is_workspace_owner(workspace_id));

-- Apenas o OWNER do workspace pode alterar o role de membros
CREATE POLICY "Owners can update workspace members"
ON public.workspace_members FOR UPDATE
TO authenticated
USING (public.is_workspace_owner(workspace_id))
WITH CHECK (public.is_workspace_owner(workspace_id));

-- Apenas o OWNER do workspace pode remover membros
CREATE POLICY "Owners can delete workspace members"
ON public.workspace_members FOR DELETE
TO authenticated
USING (public.is_workspace_owner(workspace_id));

-- ==========================================
-- 6. POLÍTICAS RLS: CLIENTS
-- ==========================================

CREATE POLICY "Workspace members can view clients"
ON public.clients FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can insert clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (public.is_workspace_member(workspace_id));

-- ==========================================
-- 7. POLÍTICAS RLS: CONTACTS
-- ==========================================

CREATE POLICY "Workspace members can view contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can insert contacts"
ON public.contacts FOR INSERT
TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can update contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can delete contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (public.is_workspace_member(workspace_id));

-- ==========================================
-- 8. POLÍTICAS RLS: CASES
-- ==========================================

CREATE POLICY "Workspace members can view cases"
ON public.cases FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can insert cases"
ON public.cases FOR INSERT
TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can update cases"
ON public.cases FOR UPDATE
TO authenticated
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can delete cases"
ON public.cases FOR DELETE
TO authenticated
USING (public.is_workspace_member(workspace_id));

-- ==========================================
-- 9. POLÍTICAS RLS: CONVERSATIONS
-- ==========================================

CREATE POLICY "Workspace members can view conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can insert conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can update conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can delete conversations"
ON public.conversations FOR DELETE
TO authenticated
USING (public.is_workspace_member(workspace_id));

-- ==========================================
-- 10. POLÍTICAS RLS: MESSAGES
-- ==========================================

CREATE POLICY "Workspace members can view messages"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND public.is_workspace_member(c.workspace_id)
    )
);

CREATE POLICY "Workspace members can insert messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND public.is_workspace_member(c.workspace_id)
    )
);

CREATE POLICY "Workspace members can update messages"
ON public.messages FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND public.is_workspace_member(c.workspace_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND public.is_workspace_member(c.workspace_id)
    )
);

CREATE POLICY "Workspace members can delete messages"
ON public.messages FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND public.is_workspace_member(c.workspace_id)
    )
);
