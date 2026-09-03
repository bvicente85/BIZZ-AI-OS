import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText } from '@/modules/documents/extractors/pdfExtractor';
import { MAX_FILE_SIZE_BYTES } from '@/modules/documents/validators/documentValidator';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum ficheiro PDF foi enviado.' },
        { status: 400 }
      );
    }

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'O ficheiro enviado não é um formato PDF suportado.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `O ficheiro excede o tamanho limite de 15 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
        },
        { status: 413 }
      );
    }

    // Processar ficheiro temporariamente em memória RAM (zero persistência em disco ou storage)
    const arrayBuffer = await file.arrayBuffer();
    const result = await extractPdfText(arrayBuffer, file.name);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      raw_text: result.raw_text,
      metadata: {
        ...result.metadata,
        filename: file.name,
        mimeType: file.type,
      },
    });
  } catch (error: unknown) {
    console.error('API /api/documents/extract error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno ao extrair documento PDF.',
      },
      { status: 500 }
    );
  }
}
