// 직종별 추가 문항 묶음. 3차분은 <직종>3.js 파일로 이어 붙입니다.
import pt from './pt.js'
import pt3 from './pt3.js'
import pt4 from './pt4.js'
import rn from './rn.js'
import rn3 from './rn3.js'
import rn4 from './rn4.js'
import rt from './rt.js'
import rt3 from './rt3.js'
import rt4 from './rt4.js'
import mt from './mt.js'
import mt3 from './mt3.js'
import mt4 from './mt4.js'
import dh from './dh.js'
import dh3 from './dh3.js'
import dh4 from './dh4.js'
import emt from './emt.js'
import emt3 from './emt3.js'
import emt4 from './emt4.js'
import dt from './dt.js'
import dt3 from './dt3.js'
import dt4 from './dt4.js'
import opt from './opt.js'
import opt3 from './opt3.js'
import opt4 from './opt4.js'
import him from './him.js'
import him3 from './him3.js'
import him4 from './him4.js'
import rd from './rd.js'
import rd3 from './rd3.js'
import rd4 from './rd4.js'

export const MORE = {
  pt: [...pt, ...pt3, ...pt4],
  rn: [...rn, ...rn3, ...rn4],
  rt: [...rt, ...rt3, ...rt4],
  mt: [...mt, ...mt3, ...mt4],
  dh: [...dh, ...dh3, ...dh4],
  emt: [...emt, ...emt3, ...emt4],
  dt: [...dt, ...dt3, ...dt4],
  opt: [...opt, ...opt3, ...opt4],
  him: [...him, ...him3, ...him4],
  rd: [...rd, ...rd3, ...rd4],
}
