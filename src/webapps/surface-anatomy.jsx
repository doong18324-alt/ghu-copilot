import { useEffect, useRef, useState } from 'react'
import { AppHeader, Notice, ChipGroup } from './kit.jsx'

/* 체표 해부 AR
   휴대폰·노트북 카메라 영상에서 몸의 관절 위치(MediaPipe Pose Landmarker, 33개 점)를 찾고,
   그 위에 뼈 분절, 근육 위치, 촉진 지점을 겹쳐 그립니다. 관절 각도로 지금 주로 쓰이는 근육을 알려 줍니다.
   영상은 브라우저 안에서만 처리하고 어디에도 보내거나 저장하지 않습니다.
   주의: 관절 점은 피부 위 대략의 위치이며, 근육·촉진점 표시는 학습용 근사치입니다. */

const VER = '1.2.3'
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

// MediaPipe Pose 번호
const P = { nose: 0, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28, lHeel: 29, rHeel: 30, lFoot: 31, rFoot: 32 }

// 뼈 분절: [시작, 끝, 이름]
const BONES = [
  ['lSh', 'rSh', '빗장뼈'], ['lSh', 'lEl', '위팔뼈'], ['rSh', 'rEl', '위팔뼈'], ['lEl', 'lWr', '노뼈·자뼈'], ['rEl', 'rWr', '노뼈·자뼈'],
  ['lHip', 'rHip', '골반'], ['lHip', 'lKn', '넙다리뼈'], ['rHip', 'rKn', '넙다리뼈'], ['lKn', 'lAn', '정강뼈·종아리뼈'], ['rKn', 'rAn', '정강뼈·종아리뼈'],
  ['lSh', 'lHip', ''], ['rSh', 'rHip', ''],
]

// 근육: [이름, 시작 점, 끝 점, 굵기 비율(어깨너비 대비), 시작 쪽 치우침 0~1, 끝 쪽 0~1, 관련 동작 키]
const MUSCLES = [
  ['어깨세모근', 'Sh', 'El', 0.32, 0, 0.42, 'abd'],
  ['위팔두갈래근', 'Sh', 'El', 0.2, 0.3, 0.95, 'elbow'],
  ['아래팔 굽힘근', 'El', 'Wr', 0.16, 0.05, 0.7, 'grip'],
  ['넙다리네갈래근', 'Hip', 'Kn', 0.3, 0.15, 0.95, 'knee'],
  ['장딴지근', 'Kn', 'An', 0.22, 0.08, 0.6, 'ankle'],
]

// 촉진 지점: [이름, 기준 점 이름, 설명]
const POINTS = [
  ['어깨뼈 봉우리(견봉)', 'Sh', '어깨 끝에서 가장 바깥쪽으로 튀어나온 뼈. 어깨 관절 위치의 기준점'],
  ['위팔뼈 가쪽위관절융기', 'El', '팔꿈치 바깥쪽 뼈 돌기. 손목 폄근이 붙는 곳(테니스엘보 압통 부위)'],
  ['넙다리뼈 큰돌기', 'Hip', '엉덩이 옆 가장 튀어나온 곳. 다리 길이 측정과 고관절 위치의 기준점'],
  ['무릎뼈', 'Kn', '무릎 앞의 둥근 뼈. 무릎뼈 아래 힘줄에서 무릎 반사를 검사'],
  ['가쪽 복사', 'An', '발목 바깥쪽 둥근 뼈. 발목 염좌 때 바로 앞쪽 인대를 촉진'],
]

const angle = (a, b, c) => {
  const v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y]
  const d = Math.hypot(...v1) * Math.hypot(...v2)
  if (!d) return null
  return Math.round(Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))) * 180 / Math.PI)
}

// 관절 각도로 지금 주로 쓰이는 근육을 고릅니다(교육용 단순 규칙).
function analyse(lm) {
  const g = k => lm[P[k]]
  const vis = k => (g(k)?.visibility ?? 0) > 0.5
  const side = (vis('lEl') ? 1 : 0) + (vis('lKn') ? 1 : 0) >= (vis('rEl') ? 1 : 0) + (vis('rKn') ? 1 : 0) ? 'l' : 'r'
  const s = k => g(side + k)
  const a = {
    elbow: vis(side + 'El') && vis(side + 'Wr') ? angle(s('Sh'), s('El'), s('Wr')) : null,
    abd: vis(side + 'El') && vis(side + 'Hip') ? angle(s('Hip'), s('Sh'), s('El')) : null,
    knee: vis(side + 'Kn') && vis(side + 'An') ? angle(s('Hip'), s('Kn'), s('An')) : null,
    hip: vis(side + 'Kn') && vis(side + 'Sh') ? angle(s('Sh'), s('Hip'), s('Kn')) : null,
  }
  const active = []
  if (a.elbow != null && a.elbow < 110) active.push(['elbow', '팔꿈치 굽힘', '위팔두갈래근(주동근), 위팔근, 위팔노근', '팔꿈치를 굽히는 동안 위팔 앞쪽 근육이 짧아지며 힘을 냅니다(구심성 수축). 천천히 펼 때는 같은 근육이 늘어나며 버팁니다(원심성 수축).'])
  if (a.abd != null && a.abd > 60) active.push(['abd', '어깨 벌림', '어깨세모근 중간섬유, 가시위근', '팔을 옆으로 들 때 처음 일부 구간은 가시위근이 시작을 돕고, 이후 어깨세모근 중간섬유가 주로 들어 올립니다. 90도를 넘으면 어깨뼈가 함께 위로 돌아갑니다(등세모근, 앞톱니근).'])
  if (a.knee != null && a.knee < 140 && a.hip != null && a.hip < 150) active.push(['knee', '쪼그려 앉기', '넙다리네갈래근, 큰볼기근, 넙다리뒤근육', '내려갈 때 무릎 폄근(넙다리네갈래근)과 엉덩관절 폄근(큰볼기근)이 늘어나며 몸무게를 버티고, 일어설 때 짧아지며 밀어 올립니다.'])
  else if (a.knee != null && a.knee < 140) active.push(['knee', '무릎 굽힘', '넙다리뒤근육, 장딴지근', '선 자세에서 발을 뒤로 들어 무릎을 굽히면 허벅지 뒤 근육이 주로 일합니다.'])
  return { a, active, side }
}

export default function SurfaceAnatomy({ app }) {
  const video = useRef(null)
  const canvas = useRef(null)
  const landmarker = useRef(null)
  const raf = useRef(0)
  const stream = useRef(null)
  const [layers, setLayers] = useState(['뼈', '근육', '촉진 지점'])
  const [state, setState] = useState('idle') // idle | loading | running | error
  const [err, setErr] = useState('')
  const [info, setInfo] = useState({ a: {}, active: [] })
  const [facing, setFacing] = useState('user')
  const layerRef = useRef(layers)
  layerRef.current = layers

  async function loadModel() {
    if (landmarker.current) return landmarker.current
    const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
    const files = await FilesetResolver.forVisionTasks(WASM)
    landmarker.current = await PoseLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO', numPoses: 1,
    })
    return landmarker.current
  }

  async function start(mode = facing) {
    setErr(''); setState('loading')
    try {
      const lmk = await loadModel()
      stop(false)
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 960 }, height: { ideal: 720 } }, audio: false })
      const v = video.current
      v.srcObject = stream.current
      await v.play()
      setState('running')
      let last = -1, tick = 0
      const loop = () => {
        if (v.readyState >= 2 && v.currentTime !== last) {
          last = v.currentTime
          const res = lmk.detectForVideo(v, performance.now())
          const lm = res.landmarks?.[0]
          draw(lm, v, mode === 'user')
          if (lm && ++tick % 6 === 0) setInfo(analyse(lm))
        }
        raf.current = requestAnimationFrame(loop)
      }
      loop()
    } catch (e) {
      setState('error')
      setErr(e?.name === 'NotAllowedError' ? '카메라 권한이 거부되었습니다. 브라우저 주소창의 카메라 아이콘에서 허용해 주세요.'
        : e?.name === 'NotFoundError' ? '이 기기에서 카메라를 찾지 못했습니다.'
          : !landmarker.current ? '몸 인식 모델을 내려받지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.'
            : `시작하지 못했습니다: ${e?.message || '알 수 없는 오류'}`)
    }
  }

  function stop(reset = true) {
    cancelAnimationFrame(raf.current)
    stream.current?.getTracks().forEach(t => t.stop())
    stream.current = null
    if (reset) setState('idle')
  }
  useEffect(() => () => stop(false), [])

  function draw(lm, v, mirror) {
    const c = canvas.current
    if (!c) return
    const W = v.videoWidth, H = v.videoHeight
    if (c.width !== W) { c.width = W; c.height = H }
    const ctx = c.getContext('2d')
    ctx.save()
    if (mirror) { ctx.translate(W, 0); ctx.scale(-1, 1) }
    ctx.drawImage(v, 0, 0, W, H)
    ctx.restore()
    if (!lm) return
    const L = layerRef.current
    const pt = k => { const p = lm[P[k]]; return { x: (mirror ? 1 - p.x : p.x) * W, y: p.y * H, v: p.visibility ?? 1 } }
    const shW = Math.hypot(pt('lSh').x - pt('rSh').x, pt('lSh').y - pt('rSh').y) || W * 0.2
    const label = (txt, x, y, bg = 'rgba(20,20,20,.78)') => {
      ctx.font = `600 ${Math.max(12, W / 60)}px Pretendard, sans-serif`
      const w = ctx.measureText(txt).width + 12, h = Math.max(20, W / 42)
      ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill()
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 1)
    }
    const activeKeys = analyse(lm).active.map(x => x[0])

    if (L.includes('근육')) {
      for (const side of ['l', 'r']) {
        for (const [name, a, b, thick, f0, f1, key] of MUSCLES) {
          const A = pt(side + a), B = pt(side + b)
          if (A.v < 0.5 || B.v < 0.5) continue
          const sx = A.x + (B.x - A.x) * f0, sy = A.y + (B.y - A.y) * f0
          const ex = A.x + (B.x - A.x) * f1, ey = A.y + (B.y - A.y) * f1
          const len = Math.hypot(ex - sx, ey - sy), ang = Math.atan2(ey - sy, ex - sx)
          const on = activeKeys.includes(key) || (key === 'knee' && activeKeys.includes('knee'))
          ctx.save(); ctx.translate((sx + ex) / 2, (sy + ey) / 2); ctx.rotate(ang)
          ctx.fillStyle = on ? 'rgba(240,90,60,.55)' : 'rgba(220,70,70,.22)'
          ctx.strokeStyle = on ? 'rgba(240,90,60,.95)' : 'rgba(220,70,70,.5)'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.ellipse(0, 0, len / 2, shW * thick / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
          ctx.restore()
          if (side === 'l' || !L.includes('뼈')) label(name, (sx + ex) / 2, (sy + ey) / 2, on ? 'rgba(200,60,40,.9)' : 'rgba(120,30,30,.7)')
        }
      }
    }
    if (L.includes('뼈')) {
      ctx.lineCap = 'round'
      for (const [a, b, name] of BONES) {
        const A = pt(a), B = pt(b)
        if (A.v < 0.5 || B.v < 0.5) continue
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = Math.max(4, shW / 18)
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke()
        ctx.strokeStyle = 'rgba(40,120,220,.9)'; ctx.lineWidth = Math.max(2, shW / 40)
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke()
        if (name && !L.includes('근육') && a.startsWith('r') === false) label(name, (A.x + B.x) / 2, (A.y + B.y) / 2, 'rgba(30,90,180,.85)')
      }
    }
    if (L.includes('촉진 지점')) {
      for (const [name, key] of POINTS) {
        for (const side of ['l', 'r']) {
          const p = pt(side + key)
          if (p.v < 0.5) continue
          ctx.fillStyle = '#FFD23F'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(6, shW / 22), 0, Math.PI * 2); ctx.fill(); ctx.stroke()
          if (side === 'l') label(name, p.x, p.y - Math.max(18, shW / 6), 'rgba(90,70,0,.85)')
        }
      }
    }
  }

  const { a = {}, active = [] } = info
  return (
    <div className="stack" style={{ gap: 16 }}>
      <AppHeader app={app} />
      <Notice tone="ok">카메라 영상은 이 기기 브라우저 안에서만 처리하며 저장하거나 전송하지 않습니다. 근육과 촉진 지점은 관절 위치로 계산한 학습용 근사 위치이므로, 실제 촉진은 교재 그림과 손으로 확인하세요.</Notice>

      <section className="card stack" style={{ gap: 12 }}>
        <ChipGroup label="겹쳐 볼 것" options={[['뼈', '뼈 분절'], ['근육', '근육 위치'], ['촉진 지점', '촉진 지점']]} value={layers} onChange={setLayers} multi />
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {state !== 'running'
            ? <button type="button" className="btn primary" onClick={() => start()} disabled={state === 'loading'}>{state === 'loading' ? '모델을 불러오는 중…' : '카메라 켜기'}</button>
            : <button type="button" className="btn" onClick={() => stop()}>멈추기</button>}
          <button type="button" className="btn soft" onClick={() => { const m = facing === 'user' ? 'environment' : 'user'; setFacing(m); if (state === 'running') start(m) }}>{facing === 'user' ? '뒤 카메라로' : '앞 카메라로'}</button>
        </div>
        {err && <Notice tone="bad">{err}</Notice>}
        <div style={{ position: 'relative', background: '#111', borderRadius: 16, overflow: 'hidden', minHeight: 240 }}>
          <video ref={video} playsInline muted style={{ display: 'none' }} />
          <canvas ref={canvas} style={{ width: '100%', display: 'block' }} />
          {state !== 'running' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ddd', textAlign: 'center', padding: 20, lineHeight: 1.7 }}>
              카메라 앞 2~3m에 서서 머리부터 발까지 화면에 들어오게 하세요.<br />몸에 붙는 옷과 밝은 조명에서 잘 잡힙니다.
            </div>
          )}
        </div>
      </section>

      <section className="card stack" style={{ gap: 10 }}>
        <div className="card-head"><h2>지금 움직임</h2></div>
        <div className="wa-form">
          {[['팔꿈치', a.elbow], ['어깨(몸통과 위팔 사이)', a.abd], ['엉덩관절', a.hip], ['무릎', a.knee]].map(([k, v]) => (
            <div key={k} className="card" style={{ padding: 14 }}><span className="muted small">{k} 각도</span><b style={{ display: 'block', fontSize: 26 }}>{v != null ? `${v}°` : '-'}</b></div>
          ))}
        </div>
        {active.length === 0
          ? <p className="muted" style={{ margin: 0 }}>팔꿈치를 굽히거나, 팔을 옆으로 들거나, 천천히 쪼그려 앉아 보세요. 쓰이는 근육이 주황색으로 바뀝니다.</p>
          : active.map(([k, motion, muscles, text]) => (
            <div key={k} className="card" style={{ padding: 14, background: 'var(--red-soft, #fff1ee)' }}>
              <b>{motion}: {muscles}</b>
              <p style={{ margin: '6px 0 0', lineHeight: 1.7 }}>{text}</p>
            </div>
          ))}
        <p className="muted small" style={{ margin: 0 }}>각도는 카메라 화면 위의 2차원 각도라, 몸이 카메라와 비스듬하면 실제 각도와 달라집니다. 측정 실습에서는 고니오미터 값과 비교해 차이를 확인해 보세요.</p>
      </section>

      <section className="card stack" style={{ gap: 8 }}>
        <div className="card-head"><h2>촉진 지점 안내</h2></div>
        {POINTS.map(([name, , desc]) => <p key={name} style={{ margin: 0, lineHeight: 1.7 }}><b>{name}</b>: {desc}</p>)}
      </section>
    </div>
  )
}
