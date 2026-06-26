#!/usr/bin/env node
/**
 * Stub de importador: lee files/Golden_Line_Modulos_GLG.xlsx y emite un volcado
 * legible para ayudar a actualizar src/products/muebles/catalog.ts cuando el
 * catálogo cambie. Hoy NO regenera el .ts (el catálogo está curado a mano para
 * controlar overlays por slot, clase de esquinero, etc.). Sirve como referencia
 * de las filas crudas para que el ajuste manual sea rápido.
 *
 *   npm run import:catalog
 */
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const XLSX_PATH = resolve(ROOT, 'files/Golden_Line_Modulos_GLG.xlsx')

const buf = await readFile(XLSX_PATH)
const wb = XLSX.read(buf, { type: 'buffer' })

for (const name of wb.SheetNames) {
  console.log(`\n===== ${name} =====`)
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' })
  for (const r of rows) console.log(JSON.stringify(r))
}

console.log('\n— Listo. Editá src/products/muebles/catalog.ts si hay diffs respecto a estas filas.')
