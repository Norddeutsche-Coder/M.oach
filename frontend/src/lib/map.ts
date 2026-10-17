/** Own raster map renderer (no third-party map library): route, heatmap layers and controls. */

export type LatLng = [number, number]
export interface MapView {
  z: number
  la: number
  ln: number
}
/** Heatmap polyline in normalized world coordinates (0..1) with bounding box [x0, x1, y0, y1]. */
export interface HeatLine {
  p: number[]
  bb: [number, number, number, number]
}
export interface TileSource {
  tile: (z: number, x: number, y: number) => string
  tmax?: number
  zmax?: number
  attr?: string
}
/** Owner of timers and observers, so the legacy lifecycle can clean them up on unmount. */
export interface MapHost {
  resizeObserver(callback: ResizeObserverCallback): ResizeObserver
  setTimeout(callback: () => void, delay?: number): number
  clearTimeout(id: number): void
}
export interface MapOptions extends Partial<TileSource> {
  layers?: HeatLine[][]
  fit?: LatLng[]
  coop?: boolean
  view?: MapView | null
  host?: MapHost
}
export interface MapHandle {
  dispose(): void
  fit(): void
  layers(layers: HeatLine[][], fit?: LatLng[] | null): void
  view(): MapView | null
  marker(point: LatLng | null): void
  tiles(): number
}
export interface TileRange {
  z: number
  n: number
  scale: number
  cx: number
  cy: number
  x0: number
  x1: number
  y0: number
  y1: number
}

export const TILE = 256
const FIT_PAD = 28
const FALLBACK_VIEW: MapView = { z: 4, la: 51, ln: 10 }

// Attribution as required by Esri for World Topo Map ("Powered by Esri" plus the service's sources).
export const TOPO_TILES: TileSource = {
  tile: (z, x, y) =>
    `https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`,
  tmax: 18,
  zmax: 18,
  attr: 'Powered by Esri · Quellen: Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), © OpenStreetMap-Mitwirkende und die GIS User Community',
}
const OSM_TILE = (z: number, x: number, y: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`

/** Web Mercator: latitude/longitude to world pixels at zoom z. */
export function project(lat: number, lon: number, z: number): [number, number] {
  const size = TILE * 2 ** z,
    sin = Math.sin((lat * Math.PI) / 180)
  return [
    ((lon + 180) / 360) * size,
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  ]
}

export function unproject(x: number, y: number, z: number): LatLng {
  const size = TILE * 2 ** z
  return [
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / size))) * 180) / Math.PI,
    (x / size) * 360 - 180,
  ]
}

/** View centered on world pixel (x, y) at zoom z; latitude is clamped like the interactive map. */
export function viewAt(x: number, y: number, z: number): MapView {
  const [la, ln] = unproject(x, y, z)
  return { z, la: Math.max(-84, Math.min(84, la)), ln }
}

/** Largest integer zoom (3..17) at which all points fit into width × height with padding. */
export function fitView(
  points: LatLng[] | null | undefined,
  width: number,
  height: number,
  pad = FIT_PAD,
): MapView {
  if (!points || !points.length) return { ...FALLBACK_VIEW }
  let south = 90,
    north = -90,
    west = 180,
    east = -180
  for (const [la, ln] of points) {
    south = Math.min(south, la)
    north = Math.max(north, la)
    west = Math.min(west, ln)
    east = Math.max(east, ln)
  }
  let z = 17
  for (; z > 3; z--) {
    const p = project(north, west, z),
      q = project(south, east, z)
    if (q[0] - p[0] <= width - 2 * pad && q[1] - p[1] <= height - 2 * pad) break
  }
  const p = project(north, west, z),
    q = project(south, east, z)
  return viewAt((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, z)
}

/** Tiles covering the view: integer tile zoom, scale for fractional zoom and the tile index range. */
export function tileRange(view: MapView, width: number, height: number, tmax = 19): TileRange {
  const z = Math.max(0, Math.min(tmax, Math.round(view.z))),
    scale = 2 ** (view.z - z),
    [cx, cy] = project(view.la, view.ln, z),
    n = 2 ** z
  return {
    z,
    n,
    scale,
    cx,
    cy,
    x0: Math.floor((cx - width / 2 / scale) / TILE),
    x1: Math.floor((cx + width / 2 / scale) / TILE),
    y0: Math.max(0, Math.floor((cy - height / 2 / scale) / TILE)),
    y1: Math.min(n - 1, Math.floor((cy + height / 2 / scale) / TILE)),
  }
}

export interface ScaleBar {
  meters: number
  px: number
  label: string
}
const EARTH_CIRCUMFERENCE = 40075016.686
const SCALE_MAX_PX = 125

/** Longest round distance (1, 2 or 5 × 10ⁿ m) that fits into 125 px; with steps ≤ 2.5 it is ≥ 50 px. */
export function scaleBar(lat: number, z: number): ScaleBar {
  const metersPerPx = (Math.cos((lat * Math.PI) / 180) * EARTH_CIRCUMFERENCE) / (TILE * 2 ** z),
    max = metersPerPx * SCALE_MAX_PX,
    base = 10 ** Math.floor(Math.log10(max)),
    meters = [5, 2, 1].map((f) => f * base).find((m) => m <= max) ?? base
  return {
    meters,
    px: meters / metersPerPx,
    label: meters >= 1000 ? `${meters / 1000} km` : `${meters} m`,
  }
}

export function isDarkUI(): boolean {
  const theme = document.documentElement.getAttribute('data-theme')
  return (
    theme === 'dark' ||
    (theme !== 'light' && !!window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)
  )
}

const defaultHost: MapHost = {
  resizeObserver: (callback) => new ResizeObserver(callback),
  setTimeout: (callback, delay) => window.setTimeout(callback, delay),
  clearTimeout: (id) => window.clearTimeout(id),
}

const CONTROLS =
  '<div class="mmz"><button type="button" data-z="1" aria-label="Vergrößern">+</button><button type="button" data-z="-1" aria-label="Verkleinern">−</button><button type="button" data-z="0" aria-label="Route zentrieren">⌖</button></div><div class="mmsc"><span></span></div><button type="button" class="mma" aria-label="Kartenquellen anzeigen" aria-expanded="false"><b>i</b><span></span></button>'
const COOP_HINT =
  '<div class="mmg" hidden>Mit zwei Fingern bewegen<br><small>Mit Strg + Mausrad zoomen</small></div>'

/** Renders a map into el: an optional route, optional heatmap layers and the map controls. */
export function mountMap(
  el: HTMLElement,
  route: LatLng[] | null,
  options: MapOptions = {},
): MapHandle {
  const opt: MapOptions = { ...options },
    host = opt.host || defaultHost,
    tileUrl = opt.tile || OSM_TILE,
    tiles = new Map<string, HTMLImageElement>()
  let st: MapView = { z: 12, la: 0, ln: 0 },
    W = 0,
    H = 0,
    mk: LatLng | null = null,
    moved = false,
    hintTimer = 0
  el.classList.toggle('mmd', isDarkUI())
  const layerCount = (opt.layers || []).length,
    paths = (cls: string) =>
      Array.from({ length: layerCount }, (_, i) => `<path class="${cls} h${i}"/>`).join('')
  // White casings are drawn below all coloured lines so crossings stay blue.
  el.innerHTML =
    '<div class="mmt"></div><svg class="mmo" aria-hidden="true">' +
    paths('mmhc') +
    paths('mmh') +
    '<path class="mmlc"/><path class="mml"/><circle class="mms" r="5.5"/><circle class="mme" r="5.5"/><circle class="mmk" r="6.5" hidden/></svg>' +
    CONTROLS +
    (opt.coop ? COOP_HINT : '')
  el.querySelector('.mma span')!.textContent = opt.attr || '© OpenStreetMap-Mitwirkende'
  const T = el.querySelector<HTMLElement>('.mmt')!,
    O = el.querySelector<SVGSVGElement>('.mmo')!,
    line = O.querySelector('.mml')!,
    lineCasing = O.querySelector('.mmlc')!,
    casings = O.querySelectorAll('.mmhc'),
    scale = el.querySelector<HTMLElement>('.mmsc')!,
    start = O.querySelector('.mms')!,
    end = O.querySelector('.mme')!,
    marker = O.querySelector('.mmk')!

  const measure = () => {
    W = el.clientWidth
    H = el.clientHeight
    O.setAttribute('viewBox', `0 0 ${W} ${H}`)
  }

  function render() {
    if (!W) return
    const range = tileRange(st, W, H, opt.tmax || 19),
      used = new Set<string>()
    for (let tx = range.x0; tx <= range.x1; tx++)
      for (let ty = range.y0; ty <= range.y1; ty++) {
        const wx = ((tx % range.n) + range.n) % range.n,
          key = `${range.z}/${tx}/${ty}`
        used.add(key)
        let im = tiles.get(key)
        if (!im) {
          const img = new Image()
          img.className = 'mmi'
          img.alt = ''
          img.draggable = false
          img.decoding = 'async'
          img.onerror = () => {
            img.style.visibility = 'hidden'
          }
          img.src = tileUrl(range.z, wx, ty)
          T.appendChild(img)
          tiles.set(key, img)
          im = img
        }
        im.style.width = im.style.height = `${TILE * range.scale + 0.6}px`
        const left = Math.round(((tx * TILE - range.cx) * range.scale + W / 2) * 10) / 10,
          top = Math.round(((ty * TILE - range.cy) * range.scale + H / 2) * 10) / 10
        im.style.transform = `translate(${left}px,${top}px)`
      }
    for (const [key, im] of tiles)
      if (!used.has(key)) {
        im.remove()
        tiles.delete(key)
      }
    const [ox, oy] = project(st.la, st.ln, st.z),
      toScreen = (la: number, ln: number): [number, number] => {
        const q = project(la, ln, st.z)
        return [q[0] - ox + W / 2, q[1] - oy + H / 2]
      }
    if (route && route.length > 1) {
      let d = ''
      route.forEach((p, i) => {
        const q = toScreen(p[0], p[1])
        d += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)
      })
      line.setAttribute('d', d)
      lineCasing.setAttribute('d', d)
      const a = toScreen(...route[0]),
        b = toScreen(...route[route.length - 1])
      start.setAttribute('cx', String(a[0]))
      start.setAttribute('cy', String(a[1]))
      end.setAttribute('cx', String(b[0]))
      end.setAttribute('cy', String(b[1]))
    }
    if (opt.layers) {
      const size = TILE * 2 ** st.z,
        layers = opt.layers
      O.querySelectorAll('.mmh').forEach((path, i) => {
        let d = ''
        for (const pl of layers[i] || []) {
          const b = pl.bb
          if (
            b[1] * size - ox + W / 2 < -8 ||
            b[0] * size - ox + W / 2 > W + 8 ||
            b[3] * size - oy + H / 2 < -8 ||
            b[2] * size - oy + H / 2 > H + 8
          )
            continue
          const p = pl.p
          d += 'M'
          for (let k = 0; k < p.length; k += 2)
            d +=
              (k ? 'L' : '') +
              (p[k] * size - ox + W / 2).toFixed(1) +
              ' ' +
              (p[k + 1] * size - oy + H / 2).toFixed(1)
        }
        path.setAttribute('d', d)
        casings[i]?.setAttribute('d', d)
      })
    }
    const bar = scaleBar(st.la, st.z)
    scale.style.width = `${bar.px.toFixed(1)}px`
    scale.firstElementChild!.textContent = bar.label
    if (mk) {
      const q = toScreen(mk[0], mk[1])
      marker.setAttribute('cx', String(q[0]))
      marker.setAttribute('cy', String(q[1]))
      marker.removeAttribute('hidden')
    } else marker.setAttribute('hidden', '')
  }

  const center = (x: number, y: number, z: number) => {
    st = viewAt(x, y, z)
  }

  function zoomAt(px: number, py: number, zoom: number) {
    moved = true
    const z = Math.max(3, Math.min(opt.zmax || 18, zoom)),
      [ox, oy] = project(st.la, st.ln, st.z),
      wx = ox + px - W / 2,
      wy = oy + py - H / 2,
      k = 2 ** (z - st.z)
    center(wx * k - (px - W / 2), wy * k - (py - H / 2), z)
    render()
  }

  function fit() {
    moved = false
    st = fitView(route && route.length ? route : opt.fit, W, H)
    render()
  }

  const showHint = () => {
    const hint = el.querySelector<HTMLElement>('.mmg')
    if (!hint) return
    hint.hidden = false
    host.clearTimeout(hintTimer)
    hintTimer = host.setTimeout(() => {
      hint.hidden = true
    }, 1300)
  }

  const pointers = new Map<number, [number, number]>()
  let pinch = 0
  el.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('.mmz,.mma') || (opt.coop && e.pointerType === 'touch'))
      return
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      // Pointer capture is optional, e.g. for synthetic events.
    }
    pointers.set(e.pointerId, [e.clientX, e.clientY])
    if (pointers.size === 2) {
      const v = [...pointers.values()]
      pinch = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1])
    }
  })
  el.addEventListener('pointermove', (e) => {
    const o = pointers.get(e.pointerId)
    if (!o) return
    const r = el.getBoundingClientRect()
    if (pointers.size === 1) {
      moved = true
      const [ox, oy] = project(st.la, st.ln, st.z)
      center(ox - (e.clientX - o[0]), oy - (e.clientY - o[1]), st.z)
      pointers.set(e.pointerId, [e.clientX, e.clientY])
      render()
    } else if (pointers.size === 2) {
      pointers.set(e.pointerId, [e.clientX, e.clientY])
      const v = [...pointers.values()],
        dist = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1])
      if (pinch > 0 && dist > 0)
        zoomAt(
          (v[0][0] + v[1][0]) / 2 - r.left,
          (v[0][1] + v[1][1]) / 2 - r.top,
          st.z + Math.log2(dist / pinch),
        )
      pinch = dist
    }
  })
  const up = (e: PointerEvent) => {
    pointers.delete(e.pointerId)
    pinch = 0
  }
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  el.addEventListener(
    'wheel',
    (e) => {
      if (opt.coop && !(e.ctrlKey || e.metaKey)) {
        showHint()
        return
      }
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomAt(e.clientX - r.left, e.clientY - r.top, st.z + (e.deltaY < 0 ? 0.6 : -0.6))
    },
    { passive: false },
  )
  el.addEventListener('dblclick', (e) => {
    const r = el.getBoundingClientRect()
    zoomAt(e.clientX - r.left, e.clientY - r.top, st.z + 1)
  })
  if (opt.coop) {
    // Cooperative gestures: one finger scrolls the page, two fingers move and zoom the map.
    let t0: { x: number; y: number; d: number } | null = null
    const twoFingers = (e: TouchEvent) => {
      const r = el.getBoundingClientRect(),
        a = e.touches[0],
        b = e.touches[1]
      return {
        x: (a.clientX + b.clientX) / 2 - r.left,
        y: (a.clientY + b.clientY) / 2 - r.top,
        d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
      }
    }
    el.addEventListener(
      'touchstart',
      (e) => {
        t0 = e.touches.length === 2 ? twoFingers(e) : null
        if (t0) e.preventDefault()
      },
      { passive: false },
    )
    el.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length >= 2) {
          e.preventDefault()
          const t = twoFingers(e)
          if (t0) {
            const [ox, oy] = project(st.la, st.ln, st.z)
            center(ox - (t.x - t0.x), oy - (t.y - t0.y), st.z)
            moved = true
            if (t0.d > 0 && t.d > 0) zoomAt(t.x, t.y, st.z + Math.log2(t.d / t0.d))
            else render()
          }
          t0 = t
        } else showHint()
      },
      { passive: false },
    )
    el.addEventListener('touchend', () => {
      t0 = null
    })
    el.addEventListener('touchcancel', () => {
      t0 = null
    })
  }
  el.querySelector('.mma')!.addEventListener('click', (e) => {
    e.stopPropagation()
    const a = e.currentTarget as HTMLElement,
      open = !a.classList.contains('open')
    a.classList.toggle('open', open)
    a.setAttribute('aria-expanded', String(open))
    a.setAttribute('aria-label', open ? 'Kartenquellen ausblenden' : 'Kartenquellen anzeigen')
  })
  el.querySelector('.mmz')!.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('button')
    if (!b) return
    e.stopPropagation()
    const z = Number(b.dataset.z)
    if (z === 0) fit()
    else zoomAt(W / 2, H / 2, Math.round(st.z) + z)
  })

  let observer: ResizeObserver | undefined
  measure()
  if (window.ResizeObserver) {
    observer = host.resizeObserver(() => {
      const before = W
      measure()
      // A hidden map (width 0) becomes visible again: keep a view the user has moved.
      if (!before && W && !moved) fit()
      else render()
    })
    observer.observe(el)
  }
  if (opt.view && isFinite(opt.view.z)) {
    st = { z: opt.view.z, la: opt.view.la, ln: opt.view.ln }
    moved = true
    render()
  } else fit()

  return {
    dispose: () => {
      observer?.disconnect()
      host.clearTimeout(hintTimer)
    },
    fit,
    layers: (layers, fitPoints) => {
      opt.layers = layers
      if (fitPoints && fitPoints.length) opt.fit = fitPoints
      if (!moved && opt.fit && opt.fit.length) fit()
      else render()
    },
    view: () => (moved ? { ...st } : null),
    marker: (point) => {
      mk = point
      render()
    },
    tiles: () => tiles.size,
  }
}
