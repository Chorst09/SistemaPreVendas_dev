import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const id = cleanText(decodeURIComponent(rawId));
  const rows = await readRows();
  const next = rows.filter((item) => resolveId(item) !== id);
  await writeRows(next);

  return NextResponse.json({ success: true, removed: rows.length - next.length });
}
