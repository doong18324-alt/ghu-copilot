// 기존 결의서 스마트 검증기(V2)의 지침 파싱·교차 검증 규칙을 옮겼습니다(화면 코드만 걷어 냄).
// 결과 항목: { category: 지침위반|금액|일자|증빙|오타, status: REJECT|WARN|PASS, snippet, basis, guide }

export const DEFAULT_RULES = {
  mealLimit: 30000,
  expertLimit: 500000,
  travelSummary: '국내출장 운임 실비 정산(승차권 필수), 일비·식비 정액 지급, 출장복명서 제출 필수',
  restrictedKeywords: ['주말', '토요일', '일요일', '공휴일', '심야', '주점', '호프', '맥주', '소주', '와인', '유흥', '노래방', '골프', '상품권'],
  requiredDocs: ['영수증/카드전표', '회의록', '출장복명서', '검수조서', '견적서'],
}

export const SAMPLE = {
  project: `2026학년도 LINC 3.0 산학연협력 선도대학 육성사업`,
  guideline: `[2026학년도 LINC 3.0 사업비 집행 및 관리 지침]
제12조(회의비 집행기준)
1. 회의비는 외부기관 인사가 1인 이상 참여한 공식 회의에 한하여 집행할 수 있으며, 식대 단가는 1인당 30,000원 이하로 제한한다.
2. 주말(토요일, 일요일), 법정공휴일 및 심야시간(23:00 이후)에는 집행할 수 없으며, 주점·호프 등 유흥성 업종 결제는 전액 불인정한다.
3. 회의비 집행 시 반드시 회의목적, 일시, 장소, 참석자 소속 및 성명, 회의내용이 포함된 '회의록'과 '법인카드 영수증'을 첨부하여야 한다.

제15조(전문가활용비 및 강사료)
1. 외부 전문가 자문료 및 특강 강사료는 1일 최대 500,000원 한도 내에서 지급하며, 이력서 및 자문결과보고서를 첨부한다.

제18조(물품구매 및 검수)
1. 100만원 이상 물품 구매 시 비교견적서 및 검수조서를 반드시 첨부하여야 하며, 반드시 사전 품의(원인행위) 승인 후 납품 및 결제를 진행하여야 한다.`,
  voucher: `--- [1페이지: 지출결의서 표지] ---
문서번호: LINC-2026-04182
사업명: 2026학년도 LINC 3.0 산학연협력 선도대학 육성사업
결의구분: 지출결의서
비목: 회의비 및 소모품비
품의(원인행위)일자: 2026-10-15
결의일자: 2026-10-16
적요: 산학협력 가족회사 기술지도 협의회 회의비 및 사무용 토너 구매
결의총액: 485,000원
거래처: (주)한빛오피스 / 사업자등록번호: 123-45-67891
입금계좌: 국민은행 (예금주 누락)

--- [2페이지: 법인카드 매출전표 (회의비)] ---
가맹점명: 참숯불갈비 및 수제맥주호프
거래일시: 2026-10-11 23:18:40 (일요일)
승인금액: 220,000원 (공급가액 200,000원 / 부가세 20,000원)
참석인원: 총 5명 (내부 3명, 외부 2명 / 1인당 단가 44,000원)
비고: 회의록 미첨부

--- [3페이지: 전자세금계산서 (물품구매)] ---
공급자: (주)한빛오피스 (사업자번호: 123-45-67891)
작성일자(납품일자): 2026-10-14
품목: 레이저프린터 토너 카트리지 2개
공급가액: 250,000원
세액(부가세): 15,000원
합계금액: 265,000원
첨부서류: 견적서 (검수조서 누락)`,
}

export function parseGuidelineRules(text, base = DEFAULT_RULES) {
      const appState = { rules: { ...base, restrictedKeywords: [...base.restrictedKeywords], requiredDocs: [...base.requiredDocs] } }
      if (!text) return appState.rules

      // 1) 회의비 / 식대 1인당 단가 추출 (예: "회의비 1인당 30,000원", "식비 1인 4만원")
      const mealRegex = /(?:회의비|식대|식비)[^.\n]{0,30}?(?:1인당|1인|인당)?\s*([0-9,]{4,7}|[1-9]만)\s*원/i;
      const mealMatch = text.match(mealRegex);
      if (mealMatch) {
        let rawNum = mealMatch[1].replace(/,/g, '');
        if (rawNum.includes('만')) {
          rawNum = parseInt(rawNum.replace('만', ''), 10) * 10000;
        } else {
          rawNum = parseInt(rawNum, 10);
        }
        if (rawNum >= 5000 && rawNum <= 200000) {
          appState.rules.mealLimit = rawNum;
        }
      }

      // 2) 강사료 / 전문가활용비 상한 추출
      const expertRegex = /(?:전문가활용비|강사료|자문료|원고료)[^.\n]{0,35}?(?:최대|상한|한도|일)?\s*([0-9,]{5,8}|[0-9]{1,2}0만)\s*원/i;
      const expertMatch = text.match(expertRegex);
      if (expertMatch) {
        let rawNum = expertMatch[1].replace(/,/g, '');
        if (rawNum.includes('만')) {
          rawNum = parseInt(rawNum.replace('만', ''), 10) * 10000;
        } else {
          rawNum = parseInt(rawNum, 10);
        }
        if (rawNum >= 50000 && rawNum <= 5000000) {
          appState.rules.expertLimit = rawNum;
        }
      }

      // 3) 여비 정산 문구 발췌
      const travelLineMatch = text.match(/([^\n.]*(?:여비|출장비|출장복명서|숙박비)[^\n.]*[.\n])/);
      if (travelLineMatch && travelLineMatch[1].trim().length > 8) {
        appState.rules.travelSummary = travelLineMatch[1].trim().slice(0, 90);
      }

      // 4) 집행 제한 키워드 탐지 보강
      const baseRestricted = ['주말', '토요일', '일요일', '공휴일', '23:', '00:', '01:', '02:', '심야', '주점', '호프', '맥주', '소주', '와인', '유흥', '노래방', '골프', '상품권'];
      const extraCandidates = ['주류', '단란주점', '백화점', '면세점', '22:', '법인카드 사적사용'];
      extraCandidates.forEach(kw => {
        if (text.includes(kw) && !baseRestricted.includes(kw)) {
          baseRestricted.push(kw);
        }
      });
      appState.rules.restrictedKeywords = baseRestricted;

      // 5) 필수 증빙 서류 키워드 탐지
      const docDictionary = ['회의록', '영수증/카드전표', '세금계산서', '출장복명서', '승차권', '검수조서', '납품서', '견적서', '비교견적서', '이력서', '자문결과보고서', '참석자서명부', '사진대지'];
      const detectedDocs = docDictionary.filter(doc => {
        const cleanDoc = doc.split('/')[0];
        return text.includes(cleanDoc);
      });
      if (detectedDocs.length > 0) {
        appState.rules.requiredDocs = detectedDocs;
      }
      return appState.rules
    }

export function runCrossValidationEngine(vText, gText, rules) {
      const results = [];
      const normalizedV = vText.replace(/\s+/g, ' ');

      // 비목 감지
      const detectedCategories = [];
      if (/회의비|식대|다과|식사|간담회/.test(vText)) detectedCategories.push('회의비');
      if (/여비|출장|숙박|운임|철도|KTX|항공/.test(vText)) detectedCategories.push('여비(출장비)');
      if (/물품|구매|소모품|토너|기자재|비품|납품/.test(vText)) detectedCategories.push('물품구매비');
      if (/전문가|강사|자문|원고료|특강|심사/.test(vText)) detectedCategories.push('전문가활용비/강사료');
      if (detectedCategories.length === 0) detectedCategories.push('일반운영비/기타');

      // -----------------------------------------------------------------------
      // [검증 영역 1: 맞춤형 지침 대조 검증]
      // -----------------------------------------------------------------------
      // 1-1. 회의비/식대 1인당 단가 한도 초과 여부
      const perPersonMatch = vText.match(/1인당\s*(?:단가)?\s*[:：]?\s*([0-9,]+)\s*원/);
      const headcountMatch = vText.match(/(?:참석인원|인원|총)\s*[:：]?\s*(\d+)\s*명/);
      const mealAmountMatch = vText.match(/(?:회의비|카드|승인금액|식대)[^\d]{0,25}([0-9,]{4,8})\s*원/);

      let calculatedPerPerson = null;
      let mealSnippet = '';

      if (perPersonMatch) {
        calculatedPerPerson = parseInt(perPersonMatch[1].replace(/,/g, ''), 10);
        mealSnippet = perPersonMatch[0];
      } else if (headcountMatch && mealAmountMatch && detectedCategories.includes('회의비')) {
        const people = parseInt(headcountMatch[1], 10);
        const totalMeal = parseInt(mealAmountMatch[1].replace(/,/g, ''), 10);
        if (people > 0 && totalMeal > 0) {
          calculatedPerPerson = Math.round(totalMeal / people);
          mealSnippet = `총액 ${totalMeal.toLocaleString()}원 ÷ ${people}명 = 1인당 ${calculatedPerPerson.toLocaleString()}원`;
        }
      }

      if (calculatedPerPerson !== null) {
        const guidelineClause = extractClauseFromGuideline(gText, ['회의비', '1인당', '단가']) ||
          `사업 집행 지침 기준: 회의비/식대 1인당 단가 상한 ${rules.mealLimit.toLocaleString()}원 이하`;
        if (calculatedPerPerson > rules.mealLimit) {
          results.push({
            category: '지침위반',
            status: 'REJECT',
            snippet: `회의비 1인당 집행단가 ${calculatedPerPerson.toLocaleString()}원 산출 (${mealSnippet})`,
            basis: guidelineClause,
            guide: `지침 상한액(${rules.mealLimit.toLocaleString()}원)을 ${(calculatedPerPerson - rules.mealLimit).toLocaleString()}원 초과했습니다. 초과분에 대한 자부담 반납 처리 또는 참석자 명단 재확인 후 집행액을 감액 조정하세요.`
          });
        } else {
          results.push({
            category: '지침위반',
            status: 'PASS',
            snippet: `회의비 1인당 집행단가 ${calculatedPerPerson.toLocaleString()}원 (기준 이내)`,
            basis: guidelineClause,
            guide: '지침상 1인당 식대 단가 한도 내에서 적정하게 산출되었습니다.'
          });
        }
      }

      // 1-2. 전문가활용비/강사료 상한 초과 여부
      if (detectedCategories.includes('전문가활용비/강사료')) {
        const expertFeeMatch = vText.match(/(?:강사료|자문료|전문가활용비|수당)[^\d]{0,20}([0-9,]{5,8})\s*원/);
        if (expertFeeMatch) {
          const fee = parseInt(expertFeeMatch[1].replace(/,/g, ''), 10);
          const guidelineClause = extractClauseFromGuideline(gText, ['전문가', '강사료', '상한']) ||
            `사업 집행 지침 기준: 전문가/강사 수당 1일 상한 ${rules.expertLimit.toLocaleString()}원`;
          if (fee > rules.expertLimit) {
            results.push({
              category: '지침위반',
              status: 'REJECT',
              snippet: `전문가/강사 수당 지급액: ${fee.toLocaleString()}원`,
              basis: guidelineClause,
              guide: `지침상 수당 지급 상한액(${rules.expertLimit.toLocaleString()}원)을 초과하였습니다. 등급별 지급 기준표에 맞게 지급액을 수정하세요.`
            });
          } else {
            results.push({
              category: '지침위반',
              status: 'PASS',
              snippet: `전문가/강사 수당 지급액: ${fee.toLocaleString()}원`,
              basis: guidelineClause,
              guide: '전문가활용비 지급 상한 기준을 충족합니다.'
            });
          }
        }
      }

      // 1-3. 집행 불가 키워드 (주말, 심야, 주류/유흥업종 등) 대조
      const matchedRestricted = [];
      rules.restrictedKeywords.forEach(kw => {
        if (!kw) return;
        if (vText.includes(kw)) {
          // 주변 문맥 20자 추출
          const idx = vText.indexOf(kw);
          const context = vText.slice(Math.max(0, idx - 15), Math.min(vText.length, idx + kw.length + 20)).replace(/\n/g, ' ');
          matchedRestricted.push({ keyword: kw, context });
        }
      });

      if (matchedRestricted.length > 0) {
        const uniqueKeywords = [...new Set(matchedRestricted.map(m => m.keyword))];
        const sampleContext = matchedRestricted.slice(0, 2).map(m => `"${m.context.trim()}"`).join(' / ');
        const guidelineClause = extractClauseFromGuideline(gText, ['주말', '심야', '주점', '불인정']) ||
          `지침 제한 조건: [${uniqueKeywords.join(', ')}] 관련 시간·요일·업종 집행 제한`;

        results.push({
          category: '지침위반',
          status: 'REJECT',
          snippet: `집행 제한 키워드 탐지 [${uniqueKeywords.join(', ')}] → ${sampleContext}`,
          basis: guidelineClause,
          guide: '주말·심야 결제 또는 주점·유흥업종 결제는 원칙적으로 사업비 집행이 불인정됩니다. 불가피한 공식 행사인 경우 사전 승인 공문 및 사유서를 첨부하고, 주류 결제가 포함된 경우 해당 금액을 반납 처리하세요.'
        });
      } else {
        results.push({
          category: '지침위반',
          status: 'PASS',
          snippet: '주말·심야 시간대 및 제한 업종(주점·유흥 등) 결제 내역 미검출',
          basis: '지침상 집행 시간·요일 및 제한 업종 준수 여부',
          guide: '집행 제한 시간 및 부적격 가맹점 키워드가 발견되지 않았습니다.'
        });
      }

      // -----------------------------------------------------------------------
      // [검증 영역 2: 금액 및 산식 일치 여부]
      // -----------------------------------------------------------------------
      // 2-1. 공급가액 + 부가세(10%) = 합계: 쪽(증빙)마다 따로 봅니다
      for (const sec of sections(vText)) results.push(...vatCheck(sec))

      // 2-2. 결의총액과 증빙 합계 대조
      const totalVoucherMatch = vText.match(/(?:결의총액|청구금액|지출총액|총액)\s*[:：]?\s*([0-9,]+)\s*원/);
      if (totalVoucherMatch) {
        const totalVoucher = parseInt(totalVoucherMatch[1].replace(/,/g, ''), 10);
        // 페이지별 승인금액 / 합계금액 합산 시도
        const evidenceAmounts = [...vText.matchAll(/(?:승인금액|합계금액)\s*[:：]?\s*([0-9,]+)\s*원/g)]
          .map(m => parseInt(m[1].replace(/,/g, ''), 10));

        if (evidenceAmounts.length > 0) {
          const sumEvidence = evidenceAmounts.reduce((acc, cur) => acc + cur, 0);
          if (totalVoucher !== sumEvidence) {
            results.push({
              category: '금액',
              status: 'WARN',
              snippet: `결의서 표지 총액(${totalVoucher.toLocaleString()}원) vs 첨부 증빙 합산액(${sumEvidence.toLocaleString()}원)`,
              basis: '결의서 표지 총액과 첨부 증빙서류 합계 일치 원칙',
              guide: `결의서 표지 금액과 첨부된 영수증/세금계산서 합계 간 ${Math.abs(totalVoucher - sumEvidence).toLocaleString()}원의 차이가 감지되었습니다. 누락된 영수증이나 중복 합산 여부를 확인하세요.`
            });
          } else {
            results.push({
              category: '금액',
              status: 'PASS',
              snippet: `결의서 표지 총액(${totalVoucher.toLocaleString()}원) = 첨부 증빙 합계(${sumEvidence.toLocaleString()}원)`,
              basis: '결의서 총액 및 증빙 합계 대조 원칙',
              guide: '결의서 표지 총액과 첨부 증빙 금액 합계가 정확히 일치합니다.'
            });
          }
        }
      }

      // -----------------------------------------------------------------------
      // [검증 영역 3: 일자 선후 관계 오류 (선집행 후품의 탐지)]
      // -----------------------------------------------------------------------
      const approvalDate = extractDateAfterLabel(vText, ['품의일자', '품의\\(원인행위\\)일자', '원인행위일자', '품의일']);
      const deliveryDate = extractDateAfterLabel(vText, ['납품일자', '검수일자', '작성일자\\(납품일자\\)', '작성일자']);
      const paymentDate = extractDateAfterLabel(vText, ['거래일시', '결제일자', '승인일자', '카드결제일']);
      const resolutionDate = extractDateAfterLabel(vText, ['결의일자', '결의일', '작성일']);

      if (paymentDate) {
        const wd = new Date(paymentDate + 'T00:00:00').getDay()
        if (wd === 0 || wd === 6) results.push({ category: '일자', status: 'WARN', snippet: `결제일 ${paymentDate}은 ${wd === 0 ? '일요일' : '토요일'}입니다`, basis: extractClauseFromGuideline(gText, ['주말', '토요일', '일요일']) || '지침상 주말·공휴일 집행 제한 여부 확인', guide: '주말 집행이 허용되는 행사인지 확인하고, 허용된다면 사전 승인 문서를 첨부하세요. 공휴일 여부는 달력으로 따로 확인하세요.' })
      }

      if (approvalDate && paymentDate && paymentDate < approvalDate) {
        results.push({
          category: '일자',
          status: 'REJECT',
          snippet: `품의(원인행위)일자(${approvalDate})보다 카드결제/거래일자(${paymentDate})가 앞섬`,
          basis: extractClauseFromGuideline(gText, ['사전 품의', '원인행위']) ||
            '국고보조금 및 연구비 회계 원칙: 모든 집행은 사전 품의(원인행위) 승인 후 집행하여야 함 (선집행 후품의 금지)',
          guide: `품의일(${approvalDate}) 이전에 집행(${paymentDate})된 '선집행 후품의' 사례입니다. 긴급 불가피한 사유가 있는 경우 '사후품의 사유서'를 첨부하거나 규정 위반 여부를 재검토하세요.`
        });
      }

      if (approvalDate && deliveryDate && deliveryDate < approvalDate) {
        results.push({
          category: '일자',
          status: 'REJECT',
          snippet: `품의(원인행위)일자(${approvalDate})보다 납품/세금계산서 작성일자(${deliveryDate})가 앞섬`,
          basis: '산학협력단 계약 및 구매 회계 원칙: 원인행위(품의) 이후 납품 및 검수 진행 필수',
          guide: `계약/품의 승인(${approvalDate}) 이전에 물품 납품 또는 세금계산서 발행(${deliveryDate})이 이루어졌습니다. 거래처에 세금계산서 수정발행 요청 또는 사유서를 보완하세요.`
        });
      }

      if (paymentDate && resolutionDate && resolutionDate < paymentDate) {
        results.push({
          category: '일자',
          status: 'WARN',
          snippet: `결의일자(${resolutionDate})가 실제 거래/결제일자(${paymentDate})보다 이전임`,
          basis: '회계 문서 작성 일자 정합성 원칙',
          guide: '결의서 작성일자가 영수증 결제일보다 빠릅니다. 결의일자를 실제 증빙 수취일 이후로 수정하세요.'
        });
      }

      if (approvalDate && (!paymentDate || paymentDate >= approvalDate) && (!deliveryDate || deliveryDate >= approvalDate)) {
        results.push({
          category: '일자',
          status: 'PASS',
          snippet: `품의일(${approvalDate}) → 집행/납품일(${paymentDate || deliveryDate || '확인'}) → 결의일(${resolutionDate || '확인'}) 순차 진행`,
          basis: '원인행위(품의) → 납품/결제 → 결의 일자 선후 관계 원칙',
          guide: '사전 품의 후 집행 및 결의 절차가 시간 순서대로 정상 진행되었습니다.'
        });
      }

      // -----------------------------------------------------------------------
      // [검증 영역 4: 필수 증빙 누락 점검]
      // -----------------------------------------------------------------------
      const missingDocs = [];
      const explicitMissingMatch = [...vText.matchAll(/([가-힣]{2,10})\s*미첨부|([가-힣]{2,10})\s*누락/g)];
      explicitMissingMatch.forEach(m => {
        const docName = m[1] || m[2];
        if (docName && !docName.includes('예금주') && !docName.includes('계좌')) {
          missingDocs.push(docName);
        }
      });

      if (detectedCategories.includes('회의비')) {
        if (!vText.includes('회의록') || vText.includes('회의록 미첨부') || vText.includes('회의록 누락')) {
          if (!missingDocs.includes('회의록')) missingDocs.push('회의록');
        }
      }
      if (detectedCategories.includes('여비(출장비)')) {
        if (!vText.includes('출장복명서') || vText.includes('복명서 누락')) {
          if (!missingDocs.includes('출장복명서')) missingDocs.push('출장복명서');
        }
      }
      if (detectedCategories.includes('물품구매비')) {
        if (!vText.includes('검수조서') || vText.includes('검수조서 누락')) {
          if (!missingDocs.includes('검수조서')) missingDocs.push('검수조서');
        }
      }
      if (detectedCategories.includes('전문가활용비/강사료')) {
        if (!vText.includes('이력서') && !vText.includes('자문결과보고서')) {
          missingDocs.push('전문가 이력서 및 자문결과보고서');
        }
      }

      if (missingDocs.length > 0) {
        results.push({
          category: '증빙',
          status: 'REJECT',
          snippet: `비목 [${detectedCategories.join(', ')}] 집행 건에 필수 증빙 누락 의심: [${missingDocs.join(', ')}]`,
          basis: extractClauseFromGuideline(gText, ['첨부', '증빙', '회의록', '검수조서']) ||
            `지침 파싱 필수 증빙 요건: ${rules.requiredDocs.join(', ')}`,
          guide: `누락된 [${missingDocs.join(', ')}] 서류를 스캔하여 결의서 합본 PDF에 추가 병합한 뒤 재상신하세요.`
        });
      } else {
        results.push({
          category: '증빙',
          status: 'PASS',
          snippet: `비목 [${detectedCategories.join(', ')}] 관련 필수 증빙 키워드 확인 완료`,
          basis: `비목별 필수 첨부서류 기준 (${rules.requiredDocs.join(', ')})`,
          guide: '해당 비목 집행에 필요한 핵심 증빙서류 항목이 문서 내에 포함되어 있습니다.'
        });
      }

      // -----------------------------------------------------------------------
      // [검증 영역 5: 오타 및 필수 기재사항 누락 점검]
      // -----------------------------------------------------------------------
      // 5-1. 사업자등록번호 자릿수 및 체크섬 검증
      const bizNumMatches = [...vText.matchAll(/사업자(?:등록)?번호\s*[:：]?\s*([0-9-]{8,15})/g)].filter((m, i, a) => a.findIndex(x => x[1] === m[1]) === i);
      if (bizNumMatches.length > 0) {
        bizNumMatches.forEach(m => {
          const rawBiz = m[1];
          const digitsOnly = rawBiz.replace(/[^0-9]/g, '');
          if (digitsOnly.length !== 10) {
            results.push({
              category: '오타',
              status: 'REJECT',
              snippet: `기재된 사업자등록번호: "${rawBiz}" (${digitsOnly.length}자리)`,
              basis: '국세청 사업자등록번호 체계: 반드시 하이픈 제외 10자리 숫자(XXX-XX-XXXXX)여야 함',
              guide: `사업자등록번호 자릿수가 10자리가 아닙니다(${digitsOnly.length}자리). 사업자등록증 사본을 대조하여 정확한 10자리 번호로 수정하세요.`
            });
          } else if (!isValidKoreanBizNumber(digitsOnly)) {
            results.push({
              category: '오타',
              status: 'WARN',
              snippet: `기재된 사업자등록번호: "${rawBiz}" (국세청 검증코드 불일치 의심)`,
              basis: '국세청 사업자등록번호 10자리 검증 알고리즘(Check-digit)',
              guide: '10자리 형식은 맞으나 마지막 검증번호가 국세청 표준 공식과 다릅니다. 오타 여부를 사업자등록증과 대조 확인하세요.'
            });
          } else {
            results.push({
              category: '오타',
              status: 'PASS',
              snippet: `사업자등록번호 "${rawBiz}" (10자리 및 유효성 검증 통과)`,
              basis: '국세청 사업자등록번호 자릿수 및 검증코드 확인',
              guide: '정상적인 사업자등록번호 형식입니다.'
            });
          }
        });
      }

      // 5-2. 계좌번호 / 예금주 누락 여부 점검
      if (vText.includes('예금주 누락') || vText.includes('계좌 누락') || (vText.includes('입금계좌') && !/[0-9-]{9,18}/.test(vText))) {
        results.push({
          category: '오타',
          status: 'REJECT',
          snippet: '입금계좌 정보 불완전 (계좌번호 미기재 또는 예금주 누락 탐지)',
          basis: '산학협력단 자금 이체 원칙: 은행명, 계좌번호, 예금주(채주 일치) 필수 기재',
          guide: '통장사본을 확인하여 은행명, 계좌번호 및 거래처명과 일치하는 예금주 성명을 정확히 기재하세요.'
        });
      }

      return { results, detectedCategories }
    }

    // 헬퍼: 라벨 뒤의 YYYY-MM-DD 또는 YYYY.MM.DD 날짜 추출
    function extractDateAfterLabel(text, labels) {
      const pattern = new RegExp(`(?:${labels.join('|')})\\s*[:：]?\\s*(20\\d{2}[-./]\\d{1,2}[-./]\\d{1,2})`);
      const match = text.match(pattern);
      if (!match) return null;
      const parts = match[1].split(/[-./]/);
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }

    // 헬퍼: 지침 텍스트에서 관련 조항 문장 발췌
    function extractClauseFromGuideline(gText, keywords) {
      if (!gText) return null
      // 낱말이 가장 많이 겹치는 줄을 고릅니다(조 제목만 있는 줄보다 본문 줄을 우선)
      const lines = gText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 10)
      let best = null, score = 0
      for (const l of lines) {
        const sc = keywords.filter(k => l.includes(k)).length + (/^제\s*\d+\s*조/.test(l) && l.length < 25 ? -0.5 : 0)
        if (sc > score) { best = l; score = sc }
      }
      return best ? best.slice(0, 140) + (best.length > 140 ? '...' : '') : null
    }

    // 헬퍼: 대한민국 사업자등록번호 체크섬 검증
    function isValidKoreanBizNumber(number10) {
      if (!/^\d{10}$/.test(number10)) return false;
      const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(number10[i], 10) * weights[i];
      }
      sum += Math.floor((parseInt(number10[8], 10) * 5) / 10);
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === parseInt(number10[9], 10);
    }

    // =========================================================================
    // 4. 하단 검증 결과 대시보드 렌더링
    // =========================================================================
    
// 증빙을 쪽 구분선(--- [n페이지] ---)이나 빈 줄 두 개로 나눕니다
function sections(t) {
  const parts = t.split(/\n\s*-{2,}\s*\[[^\]]*\]\s*-{2,}\s*\n|\n{3,}/)
  return parts.filter(x => x.trim())
}

function vatCheck(t) {
  const num = m => (m ? parseInt(m[1].replace(/,/g, ''), 10) : null)
  const supply = num(t.match(/공급가액\s*[:：]?\s*([0-9,]+)\s*원/))
  const vat = num(t.match(/(?:부가세|부가가치세|세액)\s*(?:\(부가세\))?\s*[:：]?\s*([0-9,]+)\s*원/))
  const total = num(t.match(/(?:합계금액|승인금액)\s*[:：]?\s*([0-9,]+)\s*원/))
  if (supply == null || vat == null) return []
  const out = []
  const expected = Math.round(supply * 0.1)
  if (Math.abs(vat - expected) > 10) out.push({ category: '금액', status: 'REJECT', snippet: `공급가액 ${supply.toLocaleString()}원, 세액 ${vat.toLocaleString()}원 (10%면 ${expected.toLocaleString()}원)`, basis: '일반과세 부가세는 공급가액의 10%', guide: `세액이 10%와 ${Math.abs(vat - expected).toLocaleString()}원 다릅니다. 면세 품목이 섞였는지, 잘못 적었는지 세금계산서 원본과 대조하세요.` })
  if (total != null && total !== supply + vat) out.push({ category: '금액', status: 'REJECT', snippet: `공급가액 ${supply.toLocaleString()} + 세액 ${vat.toLocaleString()} = ${(supply + vat).toLocaleString()}원, 적힌 합계 ${total.toLocaleString()}원`, basis: '증빙 금액 산식 일치', guide: '합계가 맞지 않습니다. 증빙 원본의 금액을 다시 확인해 결의서 금액란을 고치세요.' })
  if (!out.length) out.push({ category: '금액', status: 'PASS', snippet: `공급가액 ${supply.toLocaleString()} + 세액 ${vat.toLocaleString()}${total != null ? ` = 합계 ${total.toLocaleString()}원` : ''}`, basis: '공급가액·부가세 10%·합계 산식', guide: '산식이 맞습니다.' })
  return out
}
