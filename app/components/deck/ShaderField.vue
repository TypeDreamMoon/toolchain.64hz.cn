<script setup lang="ts">
/**
 * Two full-screen fragment shaders.
 *
 *  #field — the 64 Hz motif: an fbm-warped trace field plus 64 spectrum bins,
 *           sampled three times along the vector from the pointer so the
 *           channels separate into a chromatic-aberration lens under the cursor.
 *  #wipe  — the page-turn dissolve: an ordered 4x4 Bayer threshold on chunky
 *           pixels, sweeping upward.
 *
 * Both degrade: no WebGL2 falls back to the canvas 2D field, and reduced
 * motion renders one still frame and stops.
 */

const { accent, energy, wipeAt } = useDeck()

const fieldEl = shallowRef<HTMLCanvasElement>()
const wipeEl = shallowRef<HTMLCanvasElement>()

const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`

const FIELD_FRAG = `#version 300 es
precision highp float;
out vec4 frag;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uAccent;
uniform float uEnergy;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

// three drifting traces, warped by the noise field
float trace(vec2 p, float t){
  float f = fbm(p * 1.25 + vec2(t, t * 0.5));
  float v = 0.0;
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    float y = sin(p.x * (1.5 + fi * 1.25) + t * (1.6 + fi) + f * 2.0 + fi) * (0.20 - fi * 0.05);
    v += smoothstep(0.055, 0.0, abs(p.y - y)) * (0.55 - fi * 0.13);
  }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  float t = uTime * 0.05;

  // never flat black — the studio site's warm vertical base
  vec3 col = mix(vec3(0.045, 0.052, 0.066), vec3(0.055, 0.060, 0.072), uv.y);

  // chromatic lens: each channel samples the field at a different offset
  // along the vector from the pointer, so colour fringes toward the cursor
  vec2 m = uMouse * vec2(uRes.x / uRes.y, 1.0);
  float d = length(p - m);
  float lens = smoothstep(1.15, 0.0, d);
  vec2 dir = (p - m) / max(d, 0.0001);
  // The traces are ~0.055 wide, so the offset has to stay well under that:
  // past roughly a third of the feature width the whole ribbon displaces
  // instead of its edges, and the split stops reading as fringing and starts
  // reading as a rainbow. Turn FRINGE up rather than SHIFT to make it louder.
  const float SHIFT = 0.007;
  const float FRINGE = 1.7;
  float shift = (SHIFT + SHIFT * 2.0 * uEnergy) * lens;

  float g = trace(p, t);
  float r = trace(p + dir * shift, t);
  float b = trace(p - dir * shift, t);

  // Multiplying the accent by vec3(r, g, b) does not fringe it, it replaces
  // it: three different scalars on one colour is a hue change, and the field
  // smears into a rainbow wherever the channels disagree. Real aberration
  // keeps the body of the trace its own colour and only splits at the edges,
  // so the body is drawn from the centre sample and only the channel
  // *differences* are added on top. That is what lets the shift be this large.
  float amp = 0.5 + 0.85 * lens + 0.3 * uEnergy;
  col += uAccent * g * amp;
  col += vec3(r - g, 0.0, b - g) * FRINGE * (1.0 + 0.6 * uEnergy) * amp;

  // 64 spectrum bins along the bottom — the name, drawn
  float N = 64.0;
  float bx = uv.x * N;
  float px = floor(bx) / N;
  float env = sin(px * 3.14159265);
  float h = (sin(t * 22.0 + px * 9.0) * 0.5 + 0.5) * (sin(t * 8.6 + px * 21.0) * 0.5 + 0.5) * env * 0.30;
  float bar = step(0.28, fract(bx)) * step(fract(bx), 0.72) * step(uv.y, h);
  col += uAccent * bar * (0.10 + 0.16 * env + uEnergy * 0.4);

  // scanlines and a soft vignette keep it reading as a screen
  col *= 1.0 - 0.035 * step(0.5, fract(gl_FragCoord.y * 0.5));
  col *= 1.0 - 0.35 * smoothstep(0.55, 1.5, length(p * vec2(0.62, 1.0)));

  frag = vec4(col, 1.0);
}`

const WIPE_FRAG = `#version 300 es
precision highp float;
out vec4 frag;
uniform vec2 uRes;
uniform float uProgress;
uniform vec3 uAccent;

float bayer(vec2 q){
  float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 i = ivec2(mod(q, 4.0));
  return m[i.y * 4 + i.x] / 16.0;
}

void main(){
  float px = 7.0;                                   // chunky, so the pattern reads
  vec2 q = floor(gl_FragCoord.xy / px);
  // a triangle: cover on the way in, uncover on the way out
  float cover = (1.0 - abs(uProgress * 2.0 - 1.0)) * 0.72;
  // bias by height so the dissolve sweeps upward rather than landing at once
  float bias = (gl_FragCoord.y / uRes.y) * 0.28;
  float a = step(bayer(q) + bias - 0.14, cover);
  vec3 ground = vec3(0.055, 0.063, 0.078);
  frag = vec4(mix(ground, uAccent * 0.55, 0.10), a);
}`

interface GLLayer {
  gl: WebGL2RenderingContext
  u: Record<string, WebGLUniformLocation | null>
  draw: () => void
}

function makeGL(canvas: HTMLCanvasElement, frag: string, names: string[]): GLLayer | null {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: false })
  if (!gl) return null

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[ShaderField]', gl.getShaderInfoLog(s))
      return null
    }
    return s
  }

  const vs = compile(gl.VERTEX_SHADER, VERT)
  const fs = compile(gl.FRAGMENT_SHADER, frag)
  if (!vs || !fs) return null

  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[ShaderField]', gl.getProgramInfoLog(prog))
    return null
  }
  gl.useProgram(prog)

  // one oversized triangle covers the clip volume with no index buffer
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const u: Record<string, WebGLUniformLocation | null> = {}
  for (const n of names) u[n] = gl.getUniformLocation(prog, n)

  return { gl, u, draw: () => gl.drawArrays(gl.TRIANGLES, 0, 3) }
}

const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
]

onMounted(() => {
  const fieldCv = fieldEl.value!
  const wipeCv = wipeEl.value!
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')

  const field = makeGL(fieldCv, FIELD_FRAG, ['uRes', 'uTime', 'uMouse', 'uAccent', 'uEnergy'])
  const field2d = field ? null : fieldCv.getContext('2d')
  const wipe = reduce.matches ? null : makeGL(wipeCv, WIPE_FRAG, ['uRes', 'uProgress', 'uAccent'])

  if (!field) console.info('[ShaderField] WebGL2 unavailable — using the canvas 2D field')

  let W = 0
  let H = 0
  // The field is a soft, noisy image, so rendering it below device resolution
  // costs nothing visible and keeps a 4-octave fbm sampled 3x affordable.
  const FIELD_SCALE = 0.62

  function sizeCanvas(cv: HTMLCanvasElement, ctx2d: CanvasRenderingContext2D | null, scale: number) {
    const dpr = Math.min(devicePixelRatio || 1, 2) * scale
    const w = Math.max(1, Math.floor(W * dpr))
    const h = Math.max(1, Math.floor(H * dpr))
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h }
    cv.style.width = `${W}px`
    cv.style.height = `${H}px`
    if (ctx2d) ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function resize() {
    W = innerWidth || document.documentElement.clientWidth
    H = innerHeight || document.documentElement.clientHeight
    // Nothing laid out yet — sizing to 0 would leave a dead canvas.
    if (!W || !H) return
    sizeCanvas(fieldCv, field2d, field ? FIELD_SCALE : 1)
    sizeCanvas(wipeCv, null, 0.6)
    field?.gl.viewport(0, 0, fieldCv.width, fieldCv.height)
    wipe?.gl.viewport(0, 0, wipeCv.width, wipeCv.height)
  }

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
  const onPointer = (e: PointerEvent) => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1
    mouse.ty = 1 - (e.clientY / innerHeight) * 2
  }

  const cur = hex(accent.value)

  /** the canvas 2D field, used when WebGL2 is unavailable */
  function draw2d(s: number) {
    const c = field2d!
    const [r, g, b] = cur.map((v) => Math.round(v * 255))
    const rgba = (a: number) => `rgba(${r},${g},${b},${a})`
    c.clearRect(0, 0, W, H)
    const wash = c.createRadialGradient(W * 0.78, -H * 0.1, 0, W * 0.78, -H * 0.1, Math.max(W, H) * 0.95)
    wash.addColorStop(0, rgba(0.1))
    wash.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = wash
    c.fillRect(0, 0, W, H)

    const N = 64
    const gap = W / N
    for (let i = 0; i < N; i++) {
      const p = i / N
      const env = Math.sin(p * Math.PI)
      const h = (Math.sin(s * 1.1 + p * 9) * 0.5 + 0.5) * (Math.sin(s * 0.43 + p * 21) * 0.5 + 0.5) * env * H * 0.3 + 2
      c.fillStyle = rgba(0.028 + env * 0.045)
      c.fillRect(i * gap + gap * 0.28, H - h, gap * 0.44, h)
    }
    for (let k = 0; k < 2; k++) {
      c.beginPath()
      const amp = H * (k ? 0.05 : 0.085)
      const yb = H * (k ? 0.62 : 0.46)
      const sp = k ? 1.9 : 1.2
      for (let x = 0; x <= W; x += 6) {
        const u = x / W
        const y = yb + Math.sin(u * 6 * sp + s * 0.7 + k) * amp + Math.sin(u * 13 * sp - s * 0.45) * amp * 0.32
        x === 0 ? c.moveTo(x, y) : c.lineTo(x, y)
      }
      c.strokeStyle = rgba(k ? 0.05 : 0.085)
      c.lineWidth = 1
      c.stroke()
    }
  }

  const WIPE_MS = 780
  let raf = 0

  function frame(now: number) {
    if (W && H) {
      const tgt = hex(accent.value)
      for (let i = 0; i < 3; i++) cur[i]! += (tgt[i]! - cur[i]!) * 0.055
      energy.value *= 0.94
      mouse.x += (mouse.tx - mouse.x) * 0.06
      mouse.y += (mouse.ty - mouse.y) * 0.06

      if (field) {
        const { gl, u, draw } = field
        gl.uniform2f(u.uRes!, fieldCv.width, fieldCv.height)
        gl.uniform1f(u.uTime!, now / 1000)
        gl.uniform2f(u.uMouse!, mouse.x, mouse.y)
        gl.uniform3f(u.uAccent!, cur[0]!, cur[1]!, cur[2]!)
        gl.uniform1f(u.uEnergy!, energy.value)
        draw()
      } else if (field2d) {
        draw2d(now / 1000)
      }

      if (wipe) {
        const p = wipeAt.value < 0 ? -1 : (now - wipeAt.value) / WIPE_MS
        if (p >= 0 && p <= 1) {
          wipeCv.style.opacity = '1'
          const { gl, u, draw } = wipe
          gl.clearColor(0, 0, 0, 0)
          gl.clear(gl.COLOR_BUFFER_BIT)
          gl.enable(gl.BLEND)
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
          gl.uniform2f(u.uRes!, wipeCv.width, wipeCv.height)
          gl.uniform1f(u.uProgress!, p)
          gl.uniform3f(u.uAccent!, cur[0]!, cur[1]!, cur[2]!)
          draw()
        } else if (wipeAt.value >= 0) {
          wipeCv.style.opacity = '0'
          wipeAt.value = -1
        }
      }
    }
    raf = requestAnimationFrame(frame)
  }

  resize()
  addEventListener('resize', resize)
  addEventListener('pointermove', onPointer, { passive: true })
  // Some hosts lay out after the script runs; the first real size then arrives
  // as a ResizeObserver tick rather than a resize event.
  const ro = new ResizeObserver(resize)
  ro.observe(document.documentElement)

  if (reduce.matches) {
    resize()
    if (field2d) draw2d(0.9)
    else raf = requestAnimationFrame(frame)
  } else {
    raf = requestAnimationFrame(frame)
  }

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    removeEventListener('resize', resize)
    removeEventListener('pointermove', onPointer)
    ro.disconnect()
  })
})
</script>

<template>
  <div class="gfx" aria-hidden="true">
    <canvas ref="fieldEl" class="gfx__field" />
    <canvas ref="wipeEl" class="gfx__wipe" />
  </div>
</template>

<style scoped>
.gfx__field,
.gfx__wipe {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
.gfx__field { z-index: 0; }
.gfx__wipe { z-index: 45; opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .gfx__wipe { display: none; }
}
</style>
