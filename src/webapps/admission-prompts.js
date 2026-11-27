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

  const video = [
    `[숏폼 영상 · 9:16 · 약 15초, 3컷으로 나눠 생성 후 이어 붙이기]`,
    `공통 스타일(모든 컷 끝에 붙이기): ${STYLE}. ${c.light}. Mood: ${c.mood}. ${c.pace}. Vertical 9:16. ${NEG}.`,
    '',
    `컷 1 (0~5초, 도입)`,
    `${hook}. ${move}.`,
    '',
    `컷 2 (5~10초, 실습)`,
    `Inside ${v.scene}: ${v.action}. Visible details: ${v.props}. Medium shot then a close-up on hands at work. ${c.who}.`,
    '',
    `컷 3 (10~15초, 마무리)`,
    `${v.hero}. Then a quick match cut to ${v.field}, suggesting their future career. Slow push-in, hold for the last second with empty space at the top for a caption.`,
    '',
    `편집 메모: 숏폼 대본의 자막을 컷 순서대로 얹고, 마지막 컷 위쪽 여백에 학과명과 모집 일정을 넣습니다. 배경음악은 ${aud === 'adult' ? '잔잔한 피아노' : '가벼운 비트'}가 어울립니다.`,
  ].join('\n')

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
    '· 영어 그대로 넣는 것이 결과가 안정적입니다. 영상은 컷마다 따로 생성해 편집 프로그램에서 이어 붙이면 인물과 장면이 덜 흔들립니다.',
    '· 같은 인물이 이어져야 하면 컷 1에서 나온 이미지를 컷 2·3의 참조 이미지로 넣으세요.',
    '· 실제 재학생 사진이 있으면 AI 이미지보다 우선 쓰고, 출연자 초상권 동의를 받습니다. 대학 로고와 글자는 생성하지 말고 편집 단계에서 얹습니다.',
    adult === 'only' || aud === 'adult' ? '· 성인학습자 홍보는 "퇴근 후 저녁 수업" 장면이 핵심입니다. 지나치게 젊은 모델이 나오면 "in their 40s"처럼 나이를 더 구체적으로 적어 다시 생성하세요.' : '',
  ].filter(Boolean).join('\n')

  return [video, '', cover, '', slides, '', poster, '', notes].join('\n')
}
