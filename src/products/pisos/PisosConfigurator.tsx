import type { ConfiguratorProps } from '../../shell/types'
import { moneyUsd } from '../../lib/format'
import { ColorPicker } from './ColorPicker'
import { DesignCard } from './render/DesignCard'
import { TileGridSVG } from './render/TileGridSVG'
import { DESIGNS, designByKind, type DesignKind } from './designs'
import {
  colsFor, emptyCorners, fillAllCorners, fillOnlySide, fillPerimeter, makeBorderEdges, makeTiles, resizeBorderEdges, resizeTiles, rowsFor,
  type BrushSlot, type CornerPos, type PisosState, type Side,
} from './state'
import { MAX_LARGO_M, MAX_ANCHO_M, type ColorKey } from './catalog'
import './pisos.css'

export function PisosConfigurator(props: ConfiguratorProps<PisosState>) {
  const { step, setStep } = props
  if (step === 0) return <FichaTecnica onNext={() => setStep(1)} />
  if (step === 1) return <Personalizar {...props} />
  return <Resumen {...props} />
}

// ---------------------------------------------------------------- Step 0

function FichaTecnica({ onNext }: { onNext: () => void }) {
  return (
    <section className="panel pisos-ficha">
      <div className="ph"><h2>Ficha técnica</h2></div>
      <div className="ficha-body">
        <div className="ficha-icon" aria-hidden="true">▦</div>
        <div>
          <h3>Baldosa rejilla encastrable</h3>
          <p className="ficha-lead">
            Piso modular de polipropileno virgen. Encastrable sin pegamentos:
            la armás vos mismo, la mudás cuando quieras.
          </p>
          <ul className="ficha-specs">
            <li><strong>40 × 40 × 1,8 cm</strong> · una baldosa cubre 0,16 m²</li>
            <li><strong>4 Ton/m²</strong> · apta para tránsito vehicular</li>
            <li><strong>12 colores</strong> · 8 diseños rápidos o pintura libre</li>
            <li>Bordes y esquinas individuales — agregás solo los que necesitás</li>
            <li>Drena agua y aceite — ideal para zonas de lavado y boxes</li>
            <li>Marca <strong>SoluPark</strong> · stock permanente en Montevideo</li>
          </ul>
          <button type="button" className="btn cta" onClick={onNext}>
            Configurar mi piso →
          </button>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- Step 1

function Personalizar({ state, setState, setStep }: ConfiguratorProps<PisosState>) {
  // ---- Dimensiones (re-aplica diseño activo / resize borderEdges) ----
  const setLargo = (v: number) =>
    setState((s) => {
      const largo = Math.min(MAX_LARGO_M, Math.max(0, v))
      const cols = colsFor(largo)
      const rows = rowsFor(s.anchoM)
      const tiles = s.activeDesign
        ? designByKind(s.activeDesign.kind).apply(cols, rows, s.colorPrimary, s.colorSecondary, s.activeDesign.params)
        : resizeTiles(s.tiles, cols, rows, brushColor(s))
      return { ...s, largoM: largo, tiles, borderEdges: resizeBorderEdges(s.borderEdges, cols, rows) }
    })

  const setAncho = (v: number) =>
    setState((s) => {
      const ancho = Math.min(MAX_ANCHO_M, Math.max(0, v))
      const cols = colsFor(s.largoM)
      const rows = rowsFor(ancho)
      const tiles = s.activeDesign
        ? designByKind(s.activeDesign.kind).apply(cols, rows, s.colorPrimary, s.colorSecondary, s.activeDesign.params)
        : resizeTiles(s.tiles, cols, rows, brushColor(s))
      return { ...s, anchoM: ancho, tiles, borderEdges: resizeBorderEdges(s.borderEdges, cols, rows) }
    })

  // ---- Brochas de baldosa ----
  const setColor = (slot: BrushSlot) => (v: ColorKey) =>
    setState((s) => {
      const next: PisosState = {
        ...s,
        ...(slot === 'primary' ? { colorPrimary: v } : { colorSecondary: v }),
        activeBrush: slot,
      }
      if (s.activeDesign) {
        const cols = colsFor(s.largoM)
        const rows = rowsFor(s.anchoM)
        next.tiles = designByKind(s.activeDesign.kind).apply(
          cols, rows, next.colorPrimary, next.colorSecondary, s.activeDesign.params,
        )
      }
      return next
    })

  const swapBrushes = () =>
    setState((s) => {
      const next: PisosState = {
        ...s,
        colorPrimary: s.colorSecondary,
        colorSecondary: s.colorPrimary,
      }
      if (s.activeDesign) {
        const cols = colsFor(s.largoM)
        const rows = rowsFor(s.anchoM)
        next.tiles = designByKind(s.activeDesign.kind).apply(
          cols, rows, next.colorPrimary, next.colorSecondary, s.activeDesign.params,
        )
      }
      return next
    })

  // ---- Painting baldosas ----
  const paintTile = (r: number, c: number, useOther: boolean) =>
    setState((s) => {
      const color = paintColor(s, useOther)
      if (s.tiles[r]?.[c] === color && !s.activeDesign) return s
      const tiles = s.tiles.map((row, ri) =>
        ri === r ? row.map((col, ci) => (ci === c ? color : col)) : row,
      )
      return { ...s, tiles, activeDesign: null }
    })

  // ---- Painting bordes (por segmento) ----
  const paintBorder = (side: Side, idx: number, remove: boolean) =>
    setState((s) => {
      const value = remove ? null : s.bordeBrush
      const sideArr = s.borderEdges[side]
      if (sideArr[idx] === value) return s
      const newArr = sideArr.slice()
      newArr[idx] = value
      return { ...s, borderEdges: { ...s.borderEdges, [side]: newArr } }
    })

  const paintCorner = (pos: CornerPos, remove: boolean) =>
    setState((s) => {
      const value = remove ? null : s.esquinaBrush
      if (s.cornerColors[pos] === value) return s
      return { ...s, cornerColors: { ...s.cornerColors, [pos]: value } }
    })

  // ---- Brochas de borde / esquina ----
  const setBordeBrush   = (v: ColorKey) => setState((s) => ({ ...s, bordeBrush: v }))
  const setEsquinaBrush = (v: ColorKey) => setState((s) => ({ ...s, esquinaBrush: v }))

  // ---- Bulk shortcuts de bordes/esquinas ----
  const fillAllBorders = () =>
    setState((s) => {
      const cols = colsFor(s.largoM)
      const rows = rowsFor(s.anchoM)
      return {
        ...s,
        borderEdges: fillPerimeter(cols, rows, s.bordeBrush),
        cornerColors: fillAllCorners(s.esquinaBrush),
      }
    })

  const fillFrontOnly = () =>
    setState((s) => {
      const cols = colsFor(s.largoM)
      const rows = rowsFor(s.anchoM)
      // "frente" = lado de abajo (entrada del garage por convención)
      return {
        ...s,
        borderEdges: fillOnlySide(cols, rows, 'bottom', s.bordeBrush),
        cornerColors: { tl: null, tr: null, bl: s.esquinaBrush, br: s.esquinaBrush },
      }
    })

  const clearBorders = () =>
    setState((s) => {
      const cols = colsFor(s.largoM)
      const rows = rowsFor(s.anchoM)
      return { ...s, borderEdges: makeBorderEdges(cols, rows, null), cornerColors: emptyCorners() }
    })

  // ---- Diseños ----
  const applyDesign = (kind: DesignKind) =>
    setState((s) => {
      const def = designByKind(kind)
      const cols = colsFor(s.largoM)
      const rows = rowsFor(s.anchoM)
      if (cols === 0 || rows === 0) return s
      const params = {}
      const tiles = def.apply(cols, rows, s.colorPrimary, s.colorSecondary, params)
      return { ...s, prevTiles: s.tiles, tiles, activeDesign: { kind, params } }
    })

  const undo = () =>
    setState((s) => {
      if (!s.prevTiles) return s
      return { ...s, tiles: s.prevTiles, prevTiles: null, activeDesign: null }
    })

  return (
    <div className="pisos-grid pisos-grid-large">
      {/* PREVIEW */}
      <section className="panel pisos-canvas-panel">
        <div className="ph">
          <h2>Preview · pintá baldosas, bordes y esquinas</h2>
          <div className="canvas-tools">
            <button type="button" className="btn" onClick={swapBrushes} title="Intercambiar Principal ↔ Acento">
              ⇄ Invertir colores
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={undo}
              disabled={!state.prevTiles}
              title="Vuelve al estado anterior al último diseño aplicado"
            >
              ↶ Deshacer
            </button>
          </div>
        </div>
        <TileGridSVG
          state={state} size="xl"
          onPaintTile={paintTile}
          onPaintBorder={paintBorder}
          onPaintCorner={paintCorner}
        />
      </section>

      {/* CONTROLES */}
      <section className="panel pisos-controls">
        <div className="ph"><h2>Configuración</h2></div>

        {/* Dimensiones */}
        <div className="form-rows">
          <div className="form-row">
            <label htmlFor="pisos-largo">Largo (m)</label>
            <input id="pisos-largo" type="number" min={0} max={MAX_LARGO_M} step={0.1}
              value={state.largoM}
              onChange={(e) => setLargo(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-row">
            <label htmlFor="pisos-ancho">Ancho (m)</label>
            <input id="pisos-ancho" type="number" min={0} max={MAX_ANCHO_M} step={0.1}
              value={state.anchoM}
              onChange={(e) => setAncho(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        {/* Brochas de baldosa */}
        <div className="brushes">
          <div className="brushes-pickers stacked">
            <ColorPicker
              label="Brocha 1 (Principal)"
              value={state.colorPrimary}
              onChange={setColor('primary')}
              idBase="pisos-color-primary"
              compact
              active={state.activeBrush === 'primary'}
            />
            <ColorPicker
              label="Brocha 2 (Acento)"
              value={state.colorSecondary}
              onChange={setColor('secondary')}
              idBase="pisos-color-secondary"
              compact
              active={state.activeBrush === 'secondary'}
            />
          </div>
        </div>

        {/* Diseños rápidos */}
        <div className="cat">
          <h3>Diseños rápidos</h3>
          <div className="design-grid">
            {DESIGNS.map((d) => (
              <DesignCard
                key={d.kind}
                kind={d.kind}
                colorPrimary={state.colorPrimary}
                colorSecondary={state.colorSecondary}
                selected={state.activeDesign?.kind === d.kind}
                onClick={() => applyDesign(d.kind)}
              />
            ))}
          </div>
          <p className="design-hint">
            Tocá un diseño para aplicarlo. Si después pintás una baldosa a mano,
            pasás a modo libre. Las dos brochas determinan los colores del diseño.
          </p>
        </div>

        {/* Bordes y esquinas — brochas + atajos */}
        <div className="cat">
          <h3>Bordes y esquinas</h3>
          <p className="design-hint" style={{ marginTop: 0 }}>
            Elegí color y tocá los bordes del piso (o sus esquinas) en el preview.
            <strong> Click izq</strong> agrega · <strong>click der</strong> quita ·
            <strong> arrastrá</strong> sobre el perímetro para marcar varios.
          </p>
          <ColorPicker
            label="Color del borde"
            value={state.bordeBrush}
            onChange={setBordeBrush}
            idBase="pisos-bordebrush"
            compact
          />
          <ColorPicker
            label="Color de la esquina"
            value={state.esquinaBrush}
            onChange={setEsquinaBrush}
            idBase="pisos-esquinabrush"
            compact
          />
          <div className="bulk-actions">
            <span className="bulk-lbl">Atajos:</span>
            <button type="button" className="btn" onClick={fillAllBorders}>Llenar perímetro</button>
            <button type="button" className="btn" onClick={fillFrontOnly}>Solo el frente</button>
            <button type="button" className="btn ghost" onClick={clearBorders}>Vaciar</button>
          </div>
        </div>

        <div className="step-nav">
          <button type="button" className="btn ghost" onClick={() => setStep(0)}>← Atrás</button>
          <button type="button" className="btn cta" onClick={() => setStep(2)}>Ver resumen →</button>
        </div>
      </section>
    </div>
  )
}

function brushColor(s: PisosState): ColorKey {
  return s.activeBrush === 'primary' ? s.colorPrimary : s.colorSecondary
}

function paintColor(s: PisosState, useOther: boolean): ColorKey {
  const active = brushColor(s)
  if (!useOther) return active
  return s.activeBrush === 'primary' ? s.colorSecondary : s.colorPrimary
}

// ---------------------------------------------------------------- Step 2

function Resumen({ state, calc, setStep, openFinalView }: ConfiguratorProps<PisosState>) {
  return (
    <section className="panel pisos-resumen">
      <div className="ph">
        <h2>Resumen</h2>
        <div className="step-nav inline">
          <button type="button" className="btn ghost" onClick={() => setStep(1)}>← Modificar</button>
          <button type="button" className="btn cta" onClick={openFinalView}>Pedir cotización →</button>
        </div>
      </div>
      <TileGridSVG state={state} size="large" />
      <div className="resumen-spec">
        {calc.spec.map((r, i) => (
          <div key={i} className="row">
            <span className="k">{r.k}</span>
            <span className="v">{r.v}</span>
          </div>
        ))}
      </div>
      <div className="resumen-total">
        <span className="lbl">Costo total estimado</span>
        <span className="amt">{moneyUsd(calc.totalPriceUsd)}</span>
        <span className="hint">+ IVA · Precios editables en el BOM</span>
      </div>
    </section>
  )
}
