/* 입시 홍보용 이미지·영상 생성 프롬프트
   학과별 실제 실습 장면(장비·동작), 독자별 인물·분위기, 컷 구성(숏폼 3컷), 카드뉴스 장별 배경,
   카메라·조명·색 지정, 화면 비율, 금지 요소까지 넣어 영상·이미지 생성 AI(Higgsfield, Kling, Veo, Sora,
   Midjourney 등)에 그대로 넣을 수 있게 만듭니다. 장면은 학과 일반 실습을 묘사할 뿐, 특정 시설을
   우리 대학 시설이라고 주장하지 않습니다(시니어운동처방학과의 실습실 이름은 학과 홈페이지에 있는 것). */

// 학과별 장면: scene(공간), action(핵심 동작), props(장비), hero(마지막 컷), field(졸업 후 현장)
export const VISUALS = {
  '간호학과': { scene: 'a high-fidelity nursing simulation ward with patient monitors and an IV pole', action: 'nursing students in navy scrubs assessing a patient simulator, one checking vital signs while another records on a tablet', props: 'patient simulator manikin, stethoscope, vital-sign monitor', hero: 'a nursing student adjusting her stethoscope and looking up with quiet confidence', field: 'a hospital ward at dawn, a nurse walking down a bright corridor' },
  '물리치료학과': { scene: 'a physical therapy practice lab with treatment tables, parallel bars and rehabilitation equipment', action: 'physical therapy students guiding a patient through gait training between parallel bars, one spotting at the hip', props: 'parallel bars, treatment table, therapeutic ultrasound unit, resistance bands', hero: 'a student therapist placing hands on a patient’s knee during manual assessment, focused expression', field: 'a rehabilitation center gym with a therapist encouraging an older patient' },
  '방사선학과': { scene: 'a radiography practice room with an X-ray table and a CT scanner visible through a lead-glass window', action: 'radiologic technology students positioning a radiographic phantom on the X-ray table and checking the collimator light', props: 'X-ray tube and collimator, anatomical phantom, lead aprons, control console', hero: 'a student reviewing a chest X-ray on a monitor in the control room, blue screen glow on her face', field: 'a hospital imaging department control room' },
  '임상병리학과': { scene: 'a clinical laboratory with microscopes, centrifuges and automated analyzers', action: 'clinical laboratory students in white coats pipetting blood samples and examining a slide under a microscope', props: 'micropipettes, sample tubes in racks, binocular microscope, centrifuge', hero: 'extreme close-up of a gloved hand loading a sample tube, then the student’s eye at the microscope', field: 'a hospital laboratory with rows of analyzers' },
  '치위생학과': { scene: 'a dental hygiene practice clinic with dental units and phantom heads', action: 'dental hygiene students practicing scaling on a dental phantom head under the dental light', props: 'dental unit chair, phantom head, mouth mirror and scaler, dental light', hero: 'a student adjusting the dental light, mask on, eyes smiling', field: 'a bright dental clinic with a hygienist explaining brushing to a patient' },
  '치기공학과': { scene: 'a dental technology lab with work benches, plaster models and a CAD/CAM milling machine', action: 'dental technology students sculpting a wax crown under magnification and checking a digital crown design on screen', props: 'plaster dental models, wax carving tools, CAD software screen, milling machine', hero: 'macro shot of a finished ceramic crown on a fingertip, then the student’s satisfied look', field: 'a modern dental laboratory' },
  '응급구조학과': { scene: 'an emergency medical training room with an ambulance stretcher and CPR manikins', action: 'paramedic students performing team CPR on a manikin, one compressing while another prepares a bag-valve mask', props: 'CPR manikin, AED, stretcher, trauma bag', hero: 'a paramedic student in uniform zipping a trauma bag and stepping toward the ambulance door', field: 'an ambulance bay at night with emergency lights' },
  '식품영양학과': { scene: 'a nutrition and cooking lab with stainless counters and fresh ingredients', action: 'food and nutrition students in white chef jackets plating a balanced hospital meal and checking portions on a scale', props: 'fresh vegetables, digital scale, meal trays, nutrition label sheet', hero: 'top-down shot of a colorful balanced meal tray being finished', field: 'a hospital or school food service kitchen' },
  '보건행정학과': { scene: 'a health administration practice room styled like a hospital front office', action: 'health administration students reviewing electronic medical records and insurance claim screens together', props: 'dual monitors with medical record software, claim documents, headset', hero: 'a student at a hospital reception desk greeting a patient with a smile', field: 'a hospital administration office' },
  '스포츠의학과': { scene: 'a sports rehabilitation gym with turf lane, racks and treatment tables', action: 'sports medicine students applying kinesiology tape to an athlete’s shoulder and coaching a single-leg balance drill', props: 'kinesiology tape, resistance bands, balance pads, kettlebells', hero: 'a trainer kneeling beside an athlete, adjusting knee alignment during a squat', field: 'a sports rehabilitation center' },
  '사회복지학과': { scene: 'a bright community welfare center program room', action: 'social welfare students facilitating a group activity with older adults around a table', props: 'activity cards, name tags, tea cups, community bulletin board', hero: 'a student kneeling to speak at eye level with an older woman, both laughing', field: 'a community welfare center lobby' },
  '뷰티케어학과': { scene: 'a beauty care practice salon with mirrors, styling chairs and skincare beds', action: 'beauty care students styling hair, applying makeup and performing a facial treatment', props: 'styling mirrors, brushes, skincare products, ring lights', hero: 'a student stepping back to check a finished hairstyle in the mirror', field: 'a modern beauty salon' },
  '유아교육학과': { scene: 'a warm early-childhood classroom with low shelves and picture books', action: 'early childhood education students reading a picture book to a small group of preschoolers sitting on a rug', props: 'picture books, wooden toys, children’s drawings on the wall', hero: 'a student teacher kneeling as a child shows her a drawing', field: 'a kindergarten classroom in the morning' },
  '안경광학과': { scene: 'an optometry practice lab with a phoropter, slit lamp and frame display', action: 'optometry students performing a refraction test with a phoropter and fitting eyeglass frames', props: 'phoropter, slit lamp, trial lens set, eyeglass frames', hero: 'close-up through the phoropter lens to the student’s attentive eye', field: 'an optical shop with a fitting counter' },
  '손해사정학과': { scene: 'a calm evening classroom set up like an insurance claims office', action: 'adult learners reviewing claim documents and accident photos on laptops, discussing a case together', props: 'claim forms, laptop with spreadsheets, damage photos, calculator', hero: 'an adult learner circling a key figure on a claim form, nodding', field: 'an insurance adjusting firm office' },
  '상담복지학과': { scene: 'a warm counseling practice room with two armchairs and soft lamps', action: 'adult learners role-playing a counseling session, one listening attentively while another takes notes', props: 'armchairs, notebook, tissue box, soft lamp', hero: 'an adult learner leaning forward with an empathetic expression', field: 'a youth counseling center' },
  '복지경영학과': { scene: 'an evening seminar room with a community map and planning boards', action: 'adult learners planning community care services, placing sticky notes on a neighborhood map', props: 'community map, sticky notes, laptops, care plan sheets', hero: 'an adult learner presenting a care plan to classmates', field: 'a local integrated care office' },
  '중독재활복지학과': { scene: 'a quiet group counseling training room with chairs in a circle', action: 'adult learners practicing a recovery support group session, taking turns speaking and listening', props: 'circle of chairs, whiteboard, handouts', hero: 'an adult learner offering a reassuring hand gesture during role play', field: 'an addiction counseling center' },
  '시니어운동처방학과': { scene: 'an exercise intervention lab and neuromuscular biomechanics lab with gait sensors and resistance equipment', action: 'adult learners leading older adults through a resistance-band exercise class, then running a balance assessment with wearable sensors', props: 'resistance bands, balance pad, wearable motion sensors, force plate, laptop with gait data', hero: 'an adult learner kneeling to correct an older woman’s posture during a sit-to-stand exercise, both smiling', field: 'a senior community center exercise class led by a graduate instructor' },
}

const EN = { '간호학과': 'Nursing', '물리치료학과': 'Physical Therapy', '방사선학과': 'Radiological Science', '임상병리학과': 'Clinical Laboratory Science', '치위생학과': 'Dental Hygiene', '치기공학과': 'Dental Technology', '응급구조학과': 'Emergency Medical Services', '식품영양학과': 'Food and Nutrition', '보건행정학과': 'Health Administration', '스포츠의학과': 'Sports Medicine', '사회복지학과': 'Social Welfare', '뷰티케어학과': 'Beauty Care', '유아교육학과': 'Early Childhood Education', '안경광학과': 'Optometry', '손해사정학과': 'Insurance Claims Adjusting', '상담복지학과': 'Counseling and Welfare', '복지경영학과': 'Welfare Management', '중독재활복지학과': 'Addiction Rehabilitation Welfare', '시니어운동처방학과': 'Senior Exercise Prescription' }

const CAST = {
  teen: { who: 'Korean college students around 20', mood: 'energetic and hopeful', light: 'bright daylight, clean whites with navy accents', pace: 'quick cuts, upbeat rhythm' },
  parent: { who: 'Korean college students around 20 with a calm, professional instructor', mood: 'trustworthy and reassuring', light: 'soft daylight, clinical clean look, natural skin tones', pace: 'steady, unhurried camera moves' },
  adult: { who: 'Korean adult learners in their 30s to 50s, some in work clothes, attending an evening class after work', mood: 'warm, determined and dignified', light: 'evening interior warm light with cool blue dusk outside the windows', pace: 'gentle, steady camera moves' },
  mix: { who: 'Korean college students around 20 alongside a professor', mood: 'confident and welcoming', light: 'bright natural light with navy and sky-blue accents', pace: 'balanced rhythm' },
}

const STYLE = 'photorealistic, shot on a full-frame cinema camera, 35mm lens, shallow depth of field, natural skin texture, subtle film grain, color palette of navy, sky blue and clean white'
const NEG = 'no text, no captions, no logos, no watermarks, no real hospital or brand names, no distorted hands or extra fingers, no exaggerated smiles, no stock-photo posing'

const pick = a => a[Math.floor(Math.random() * a.length)]

export function buildPrompts({ dept, aud, adult }) {
  const v = VISUALS[dept] || VISUALS['물리치료학과']
  const en = EN[dept] || 'Health Sciences'
  const c = CAST[aud] || CAST.teen
  const hook = aud === 'adult'
    ? `Opening: dusk outside a campus building, ${c.who.split(',')[0]} walking in from the parking lot with a bag, lights of the practice room turning on`
    : `Opening: ${v.scene}, door opens and ${c.who.split(' with ')[0]} walk in, camera follows from behind`
  const move = pick(['slow dolly-in', 'smooth handheld follow', 'slow orbit', 'slider move left to right'])

  const cover = [
    `[카드뉴스 1장 표지 · 4:5 (1080×1350)]`,
    `Editorial admissions photo for a Korean health university, Department of ${en}. Setting: ${v.scene}. Action: ${v.action}. Cast: ${c.who}. ${c.light}. Mood: ${c.mood}. Subject in the lower two-thirds, clean empty space in the top third for a large Korean headline. ${STYLE}. 4:5 portrait. ${NEG}.`,
  ].join('\n')

  const slides = [
    `[카드뉴스 2~5장 배경 · 4:5]`,
    `2장(${aud === 'adult' ? '시간과 비용' : '졸업 후 성과'}): ${aud === 'adult' ? 'Minimal still life of a laptop, planner and coffee on a desk in an evening classroom, warm lamp light, soft focus background' : `Wide shot of ${v.field}, soft focus, calm atmosphere`}, large empty area for text. ${STYLE}. 4:5. ${NEG}.`,
    `3장(면허·자격): Flat lay of ${v.props} on a clean light-blue surface, top-down, generous negative space on the left for a list of certificates. ${NEG}.`,
    `4장(학과 강점): Close-up of hands at work with ${v.props.split(',')[0]} in ${v.scene}, background softly blurred, ${c.light}, empty space on one side for text. ${NEG}.`,
    `5장(모집 안내): Soft gradient background in navy to sky blue with subtle abstract light shapes, plenty of space for contact details and a QR code. ${NEG}.`,
  ].join('\n')

  const poster = [
    `[세로 포스터 · 2:3]`,
    `Cinematic admissions poster key visual for the Department of ${en} at a Korean health university. Hero moment: ${v.hero}. Background: ${v.scene}, softly blurred. ${c.light}. Mood: ${c.mood}. Strong vertical composition, subject on the lower half, wide clean sky-blue space at the top for a Korean headline and dates. ${STYLE}. 2:3 portrait. ${NEG}.`,
  ].join('\n')

  const notes = [
    '[쓰는 법]',
    '· 영어 그대로 넣는 것이 결과가 안정적입니다.',
    '· 실제 재학생 사진이 있으면 AI 이미지보다 우선 쓰고, 출연자 초상권 동의를 받습니다. 대학 로고와 글자는 생성하지 말고 편집 단계에서 얹습니다.',
    adult === 'only' || aud === 'adult' ? '· 성인학습자 홍보는 "퇴근 후 저녁 수업" 장면이 핵심입니다. 지나치게 젊은 모델이 나오면 "in their 40s"처럼 나이를 더 구체적으로 적어 다시 생성하세요.' : '',
  ].filter(Boolean).join('\n')

  return [cover, '', slides, '', poster, '', notes].join('\n')
}

/* ── 플랫폼·길이·스타일별 영상 기획 ── */

// 플랫폼 규격(2026년 기준 일반 권장값). 길이는 플랫폼에서 잘 보이는 범위로만 고르게 합니다.
export const PLATFORMS = {
  reels: { label: '인스타 릴스', ratio: '9:16', size: '1080×1920', lengths: [15, 30, 60, 90], vertical: true,
    safe: '위쪽 약 1/8(계정 이름)과 아래쪽 약 1/5(설명·음원), 오른쪽 가장자리(좋아요·댓글 버튼)에는 자막과 얼굴을 두지 않습니다.',
    tip: '처음 1~2초에 결론이나 가장 강한 장면을 둡니다. 음악은 인스타 앱의 음원 목록에서 붙이면 저작권 문제를 피할 수 있습니다. 커버 이미지는 4:5로 잘려 보이니 가운데에 핵심을 둡니다.' },
  shorts: { label: '유튜브 쇼츠', ratio: '9:16', size: '1080×1920', lengths: [15, 30, 60], vertical: true,
    safe: '아래쪽 약 1/4(제목·채널·구독 버튼)과 오른쪽 가장자리(좋아요·댓글)에는 자막을 두지 않습니다.',
    tip: '반복 재생되므로 마지막 컷이 첫 컷으로 자연스럽게 이어지면 좋습니다. 음악은 유튜브 오디오 보관함이나 쇼츠 음원에서 고릅니다. 제목에 학과명과 #Shorts를 넣습니다.' },
  youtube: { label: '유튜브 일반 영상', ratio: '16:9', size: '1920×1080', lengths: [60, 120, 180], vertical: false,
    safe: '아래쪽 약 1/10은 재생 막대에 가려질 수 있습니다. 마지막 5~20초는 최종 화면(구독·다른 영상) 자리로 비워 둡니다.',
    tip: '썸네일은 따로 만듭니다(1280×720). 처음 15초 안에 무엇을 보여 줄지 말하고, 챕터를 나눠 설명란에 시간표를 적습니다.' },
  feed: { label: '인스타 피드 영상', ratio: '4:5', size: '1080×1350', lengths: [15, 30, 60], vertical: true,
    safe: '가장자리 5% 안쪽에 자막을 둡니다. 소리 없이 보는 사람이 많으니 자막을 꼭 넣습니다.',
    tip: '카드뉴스와 같은 4:5 비율이라 게시물 묶음으로 올리기 좋습니다.' },
  tiktok: { label: '틱톡', ratio: '9:16', size: '1080×1920', lengths: [15, 30, 60], vertical: true,
    safe: '아래쪽 약 1/5(설명·음원)과 오른쪽 가장자리(버튼)에는 자막과 얼굴을 두지 않습니다.',
    tip: '유행 음원과 챌린지 해시태그를 함께 씁니다. 음원은 앱 안의 상업용 음원 목록에서 고릅니다.' },
}

// 영상 스타일: sec(컷 길이), how(한 줄 설명), shots(컷 장면 목록. 길이에 맞춰 순서대로 쓰고 모자라면 가운데를 반복)
export const STYLES = {
  story: { label: '스토리형(하루 이야기)', sec: 5, how: '한 사람의 하루를 따라가며 자연스럽게 학과를 보여 줍니다.' },
  interview: { label: '재학생 인터뷰형', sec: 6, how: '재학생 한마디와 실습 장면을 번갈아 보여 줍니다. 말하는 장면은 실제 촬영을 권합니다.' },
  highlight: { label: '실습 하이라이트', sec: 3, how: '빠른 컷 몽타주로 실습 장비와 손동작을 리듬감 있게 보여 줍니다.' },
  info: { label: '정보형(자막 카드)', sec: 5, how: '자격, 진로, 수업 방식을 자막으로 하나씩 보여 주는 배경 영상입니다.' },
  dance: { label: '댄스·챌린지', sec: 4, how: '유행 챌린지 안무를 실습복 차림으로 학과 공간을 옮겨 가며 춥니다.' },
  beforeafter: { label: '입학 전·후 비교', sec: 5, how: '입학 전 고민하던 모습과 지금의 실습 모습을 대비합니다.' },
  skit: { label: '상황극', sec: 5, how: '짧은 대화 상황으로 웃음을 주고 마지막에 학과를 소개합니다.' },
}

function shotsFor(style, v, c, aud, challenge) {
  const adult = aud === 'adult'
  const who = c.who.split(',')[0]
  const S = {
    story: [
      ['도입', adult ? `Dusk, ${who} leaving an office building and checking the time, then driving to a college campus` : `Morning, ${who} walking onto a college campus with friends`],
      ['준비', `${adult ? 'An adult learner' : 'A student'} changing into practice attire at a locker, determined look in the mirror`],
      ['실습 시작', `Inside ${v.scene}: ${v.action}`],
      ['손 클로즈업', `Close-up of hands working with ${v.props}`],
      ['동기들과', `Classmates laughing together during a short break in ${v.scene}`],
      ['교수님 피드백', `A professor giving one-on-one feedback, the learner nodding and trying again`],
      ['핵심 장면', v.hero],
      ['미래 현장', `Match cut to ${v.field}, the same person now working there`],
      ['마무리', adult ? 'Night campus, the learner walking out under street lights, tired but smiling, empty sky for a caption' : 'Golden hour campus, the student turning back to the camera with a smile, empty sky for a caption'],
    ],
    interview: [
      ['인터뷰 1', `Medium close-up of ${adult ? 'an adult learner in their 40s' : 'a student'} speaking to someone just off camera in ${v.scene}, natural gestures, soft key light`],
      ['B-roll', `${v.action}`],
      ['인터뷰 2', `Same person, tighter framing, thoughtful pause then a confident smile`],
      ['B-roll', `Close-up of ${v.props}`],
      ['인터뷰 3', `Same person walking with the camera through the hallway while talking`],
      ['마무리', `${v.hero}, empty space at the top for a caption`],
    ],
    highlight: [
      ['훅', `Extreme close-up of ${v.props.split(',')[0]} snapping into action, fast whip pan`],
      ['실습 1', v.action],
      ['장비 매크로', `Macro details of ${v.props}`],
      ['팀', `Team of ${who} working together, quick handheld`],
      ['핵심 장면', v.hero],
      ['현장', v.field],
      ['마무리', `Final freeze-frame of the group in ${v.scene}, empty space for a caption`],
    ],
    info: [
      ['제목 배경', `Slow push-in on ${v.scene}, softly blurred, large empty space in the center for a title`],
      ['자격 소개 배경', `Top-down flat lay of ${v.props} on a light-blue surface, empty space on the left`],
      ['수업 방식 배경', adult ? 'Evening classroom with warm lights, laptops open, soft focus' : `${who} in ${v.scene}, soft focus background`],
      ['진로 배경', `${v.field}, soft focus, calm`],
      ['마무리 배경', 'Navy to sky-blue gradient with subtle light movement, space for contact details'],
    ],
    dance: [
      ['시작 포즈', `${who} in practice attire striking the opening pose of the dance challenge in ${v.scene}, full body in frame`],
      ['안무 1', `Group performing the first part of the choreography in sync, full body, camera static at chest height`],
      ['장소 전환', `On the beat drop, a quick transition to the hallway, same choreography continuing`],
      ['안무 2', `Close shot on the signature move, playful expressions, one member holding ${v.props.split(',')[0]} as a prop`],
      ['안무 3', `Rooftop or campus lawn, the group finishing the choreography`],
      ['마지막 포즈', `Final pose facing the camera, a beat of silence, empty space at the top for the department name`],
    ],
    beforeafter: [
      ['입학 전', adult ? 'An office worker in their 40s at a desk late at night, staring at a career search page, tired' : 'A high school student at a desk surrounded by college brochures, confused'],
      ['전환', 'A hand flipping a page or a lamp switching on, used as a transition'],
      ['입학 후 실습', `Inside ${v.scene}: ${v.action}`],
      ['성장', v.hero],
      ['졸업 후', v.field],
      ['마무리', 'Split screen of before and after, empty space for a caption'],
    ],
    skit: [
      ['대화 시작', adult ? 'Two coworkers in an office at 6 pm, one packing a bag quickly, the other asking where they are going' : 'Two friends at a cafe, one showing their phone with a college admissions page'],
      ['반전', `Cut to the same person entering ${v.scene}, putting on practice attire`],
      ['실습', v.action],
      ['한마디', `The person looking at the camera with a knowing smile`],
      ['마무리', `${v.hero}, empty space for a caption`],
    ],
  }
  return S[style]
}

// 한 사람이 처음부터 끝까지 나오는 영상은 주인공 생김새를 구체적으로 고정해야 얼굴이 바뀌지 않습니다.
// (힉스필드 Seedance 2.5 시험 결과: '40대 중반'만 쓰면 50대 후반처럼 나와 머리색·피부까지 적는 편이 맞습니다)
const HEROES = {
  adult: ['a Korean man who looks exactly 45, mostly black short hair, smooth skin, rimless glasses, slim build', 'a Korean woman who looks exactly 42, shoulder-length black hair tied back, natural makeup, warm eyes', 'a Korean man who looks exactly 38, neat black hair, clean-shaven, athletic build'],
  teen: ['a Korean college student who looks 20, short black hair, bright eyes, slim build', 'a Korean college student who looks 20, long black hair in a ponytail, natural makeup'],
}

export function buildVideoPlan({ dept, aud, platform = 'reels', length = 30, style = 'story', challenge = {} }) {
  const v = VISUALS[dept] || VISUALS['물리치료학과']
  const en = EN[dept] || 'Health Sciences'
  const c = CAST[aud] || CAST.teen
  const p = PLATFORMS[platform]
  const st = STYLES[style]
  const n = Math.max(3, Math.round(length / st.sec))
  const base = shotsFor(style, v, c, aud, challenge)
  // 길이에 맞춰 컷을 고릅니다: 첫 컷과 마지막 컷은 고정하고, 가운데는 순서대로 쓰고 모자라면 반복합니다.
  const mid = base.slice(1, -1)
  const shots = n <= base.length
    ? [base[0], ...mid.slice(0, n - 2), base[base.length - 1]]
    : [base[0], ...Array.from({ length: n - 2 }, (_, i) => i < mid.length ? mid[i] : [`${mid[i % mid.length][0]} (다른 장소·각도)`, `${mid[i % mid.length][1]}, from a different angle and location than before`]), base[base.length - 1]]
  const per = length / shots.length
  const fmt = s => `${Math.round(s)}초`
  const style_ = `${STYLE}. ${c.light}. Mood: ${c.mood}. ${c.pace}. Aspect ratio ${p.ratio}${p.vertical ? ', vertical framing with subjects centered' : ', horizontal widescreen framing'}. ${NEG}.`
  const dance = style === 'dance'
  const hero = pick(HEROES[aud === 'adult' ? 'adult' : 'teen'])
  const lines = [
    `[영상 기획 · ${p.label} · ${p.ratio} (${p.size}) · ${length < 60 ? length + "초" : length / 60 + "분"} · ${st.label}]`,
    `학과: ${dept} (Department of ${en}) / 독자: ${c.who}`,
    `구성: ${st.how} 컷 ${shots.length}개, 컷당 약 ${Math.round(per)}초`,
    '',
    `공통 스타일(모든 컷 끝에 붙이기)`,
    style_,
    style !== 'info' && style !== 'dance' ? `Main character (same face, hair and build in every shot): ${hero}.` : '',
    dance ? `Choreography: ${challenge.desc ? challenge.desc : 'a currently trending short-form dance challenge'}. Keep movements clean and readable, full body visible, synchronized group.` : '',
    '',
    ...shots.flatMap(([title, prompt], i) => [
      `컷 ${i + 1} (${fmt(i * per)}~${fmt((i + 1) * per)}) · ${title}`,
      `${prompt}. ${i === 0 ? 'Strong opening frame that works as a thumbnail. ' : ''}${i === shots.length - 1 ? 'Hold the last second still. ' : ''}`,
      '',
    ]),
    `[${p.label} 업로드 메모]`,
    `· 자막 안전 영역: ${p.safe}`,
    `· ${p.tip}`,
    `· 한 번에 만들기: 힉스필드 Seedance 2.5처럼 30초까지 되는 모델은 위 컷을 한 프롬프트에 모두 넣어 한 번에 만들면 주인공 얼굴이 끝까지 유지됩니다(30초·720p 약 210크레딧).`,
    `· 컷별로 만들기: 컷마다 다시 만들 수 있는 대신 얼굴이 바뀌기 쉬우니, 첫 컷 이미지를 다음 컷의 참조 이미지로 넣습니다. 이어 붙이기는 캡컷·프리미어 등에서 합니다.`,
    `· 나이가 많아 보이면 "looks exactly 45, mostly black hair"처럼 나이와 머리색을 더 구체적으로 적습니다.`,
  ]
  if (dance) {
    lines.push(
      '',
      '[챌린지 따라 하기]',
      challenge.url ? `· 참고 영상: ${challenge.url}` : '· 참고 영상 링크를 넣으면 여기에 함께 적힙니다.',
      challenge.song ? `· 음원: ${challenge.song}. 영상에 음원을 직접 넣지 말고 업로드할 때 플랫폼 음원 목록에서 붙입니다(저작권).` : '· 음원은 영상에 직접 넣지 말고 업로드할 때 플랫폼 음원 목록에서 붙입니다(저작권).',
      '· 안무를 정확히 맞추려면: 참고 영상을 내려받아 힉스필드 「Genjutsu(동작 따라 하기)」에 참조 영상으로 넣고, 학생 이미지(실제 사진 또는 위 컷 1 이미지)를 함께 넣으면 그 동작을 그대로 따라 합니다.',
      '· 실제 학생이 춤추는 영상이 가장 반응이 좋습니다. AI 영상은 촬영 전 콘티(동선·장소 확인)로 먼저 써 보는 것을 권합니다.',
    )
  }
  if (style === 'interview') lines.push('', '· 인터뷰 장면은 AI로 입 모양을 만들면 어색하기 쉽습니다. 실제 재학생 인터뷰를 찍고, AI 영상은 B-roll(실습 장면)에만 쓰는 것을 권합니다.')
  return lines.filter(x => x !== '').join('\n').replace(/\n(컷 \d|\[|공통|·)/g, '\n\n$1').replace(/\n\n·/g, '\n·')
}
