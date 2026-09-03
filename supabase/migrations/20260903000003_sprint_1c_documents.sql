-- BIZZ-AI-OS: Sprint 1C-A Documents & Extraction Migration
-- Version: 20260903000003
-- Scope: documents table, metadata, content hash, RLS policies

-- ============================================================================
-- 1. TABELA DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    client_id UUID NULL REFERENCES public.clients(id) ON DELETE SET NULL,
    case_id UUID NULL REFERENCES public.cases(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('manual_text', 'pdf')),
    original_filename TEXT NULL,
    mime_type TEXT NULL,
    source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_hash TEXT NULL,
    raw_text TEXT NOT NULL,
    markdown_content TEXT NOT NULL,
    processing_status TEXT NOT NULL DEFAULT 'completed' CHECK (processing_status IN ('processing', 'completed', 'failed')),
    processing_error TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at automático
DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 2. ÍNDICES DE PERFORMANCE E INTEGRIDADE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON public.documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_source_type ON public.documents(source_type);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON public.documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON public.documents(content_hash);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Membros do workspace podem consultar os documentos
CREATE POLICY "Workspace members can view documents"
ON public.documents FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id));

-- Membros do workspace podem criar documentos
CREATE POLICY "Workspace members can insert documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id));

-- Membros do workspace podem atualizar documentos
CREATE POLICY "Workspace members can update documents"
ON public.documents FOR UPDATE
TO authenticated
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

-- Membros do workspace podem apagar documentos
CREATE POLICY "Workspace members can delete documents"
ON public.documents FOR DELETE
TO authenticated
USING (public.is_workspace_member(workspace_id));
