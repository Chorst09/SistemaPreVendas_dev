import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const DATA_DIR = path.join(process.cwd(), '.portal-busca-data');
const DATA_FILE = path.join(DATA_DIR, 'licitacoes-gerenciadas.json');

const ensureDataFile = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '[]', 'utf8');
  }
};

const readRows = async () => {
  await ensureDataFile();
  try {
    const rows = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
};

const writeRows = async (rows: any[]) => {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(rows, null, 2), 'utf8');
};

const cleanText = (value: unknown, max = 1200) => String(value || '').trim().slice(0, max);

const resolveId = (item: any = {}) =>
  cleanText(
    item.id ||
    item.numeroControlePNCP ||
    item.numero ||
    item.link ||
    [item.fonte, item.orgao, item.titulo, item.dataAbertura].filter(Boolean).join('|')
  );

export async function GET() {
  const rows = (await readRows()).sort((a, b) => {
    const aTime = Date.parse(a.gerenciadaEm || a.createdAt || '') || 0;
    const bTime = Date.parse(b.gerenciadaEm || b.createdAt || '') || 0;
    return bTime - aTime;
  });

  return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const input = payload?.item && typeof payload.item === 'object' ? payload.item : payload;
  const id = resolveId(input);

  if (!id) {
    return NextResponse.json({ error: 'Identificador da licitação é obrigatório.' }, { status: 400 });
  }

  const rows = await readRows();
  const now = new Date().toISOString();
  const nextItem = {
    ...input,
    id,
    createdAt: input.createdAt || now,
    gerenciadaEm: input.gerenciadaEm || now,
    updatedAt: now
  };

  const existingIndex = rows.findIndex((item) => resolveId(item) === id);
  if (existingIndex >= 0) rows[existingIndex] = { ...rows[existingIndex], ...nextItem };
  else rows.unshift(nextItem);

  await writeRows(rows);

  return NextResponse.json({ data: nextItem }, { status: existingIndex >= 0 ? 200 : 201 });
}
