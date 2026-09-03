# BIZZ-AI-OS
**AI Business Operating System**

> Fundação técnica inicial em desenvolvimento.

## Stack Tecnológica

- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS

## Estrutura do Projeto

```text
src/
├── app/                  # Rotas e páginas da aplicação (Next.js App Router)
├── components/           # Componentes UI partilhados
├── lib/                  # Utilitários e configurações transversais
├── types/                # Definições globais de TypeScript
└── modules/              # Módulos de domínio (preparados para o futuro)
    ├── clients/          # Gestão de clientes
    ├── cases/            # Gestão de casos/processos
    ├── ai-engine/        # Orquestração e serviços de IA
    ├── memory/           # Gestão de memória e contexto
    ├── knowledge/        # Base de conhecimento e documentos
    └── integrations/     # Integrações com serviços externos
```

## Como Executar Localmente

1. Instalar dependências (caso ainda não estejam instaladas):
   ```bash
   npm install
   ```

2. Executar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abrir no navegador:
   [http://localhost:3000](http://localhost:3000)

