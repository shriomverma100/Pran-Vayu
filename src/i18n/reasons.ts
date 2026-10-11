import type { ActionCode, Reason } from '../core/scoring'

type Lang = 'en' | 'hi'
type V = Record<string, string | number>

const tests = (n: number) => (n === 1 ? '1 test' : `${n} tests`)

const REASON_TEXT: Record<Lang, Record<string, (v: V) => string>> = {
  en: {
    DO_ZERO: (v) => `Oxygen fell to 0 mg/l in ${tests(+v.count)}. No fish can live at 0.`,
    DO_SEVERE: (v) => `Oxygen fell as low as ${v.min} mg/l in ${tests(+v.count)}, far below the minimum of 5.`,
    DO_BELOW: (v) => `Oxygen was below the bathing minimum of 5 mg/l in ${v.count} of ${tests(+v.tested)}.`,
    DO_OK: (v) => `Oxygen stayed at or above 5 mg/l in all ${tests(+v.tested)} (lowest ${v.min}).`,
    DO_PUSHED_BELOW: (v) => `Immersion pushed oxygen from above 5 to below 5 in ${v.count === 1 ? '1 festival' : `${v.count} festivals`}.`,
    DO_LOW_BEFORE: (v) => `Oxygen was already below 5 before immersion began in ${v.count === 1 ? '1 festival' : `${v.count} festivals`}: the water is stressed even without visarjan.`,
    DO_NOT_RECOVERED: (v) => `One week after immersion, oxygen was still below 5 in ${v.count} of ${tests(+v.tested)}.`,
    BOD_ABOVE: (v) => `BOD (organic waste) was above the limit of 3 mg/l in ${v.count} of ${tests(+v.tested)}.`,
    PH_OUTSIDE: (v) => `pH was outside the safe range of 6.5 to 8.5 in ${v.count} of ${tests(+v.tested)}.`,
    DURGA_2025_MISSING: (v) => `Not tested at Durga 2025: only ${v.tested} of ${v.total} expected tests exist. Missing is not clean.`,
    SLOTS_MISSING: (v) => `${v.tested} of ${v.total} expected tests exist; some readings in them are missing.`,
  },
  hi: {
    DO_ZERO: (v) => `${v.count} जाँचों में ऑक्सीजन 0 mg/l तक गिरी। 0 पर कोई मछली जीवित नहीं रह सकती।`,
    DO_SEVERE: (v) => `${v.count} जाँचों में ऑक्सीजन ${v.min} mg/l तक गिरी, जो न्यूनतम 5 से बहुत कम है।`,
    DO_BELOW: (v) => `${v.tested} में से ${v.count} जाँचों में ऑक्सीजन स्नान-मानक 5 mg/l से कम थी।`,
    DO_OK: (v) => `सभी ${v.tested} जाँचों में ऑक्सीजन 5 mg/l या अधिक रही (न्यूनतम ${v.min})।`,
    DO_PUSHED_BELOW: (v) => `${v.count} पर्वों में विसर्जन ने ऑक्सीजन को 5 से ऊपर से 5 से नीचे गिरा दिया।`,
    DO_LOW_BEFORE: (v) => `${v.count} पर्वों में विसर्जन शुरू होने से पहले ही ऑक्सीजन 5 से कम थी: विसर्जन के बिना भी पानी दबाव में है।`,
    DO_NOT_RECOVERED: (v) => `विसर्जन के एक सप्ताह बाद भी ${v.tested} में से ${v.count} जाँचों में ऑक्सीजन 5 से कम थी।`,
    BOD_ABOVE: (v) => `${v.tested} में से ${v.count} जाँचों में BOD (जैविक कचरा) सीमा 3 mg/l से अधिक था।`,
    PH_OUTSIDE: (v) => `${v.tested} में से ${v.count} जाँचों में pH सुरक्षित सीमा 6.5 से 8.5 के बाहर था।`,
    DURGA_2025_MISSING: (v) => `दुर्गा 2025 में जाँच नहीं हुई: ${v.total} में से केवल ${v.tested} जाँचें उपलब्ध। जाँच न होना साफ़ होना नहीं है।`,
    SLOTS_MISSING: (v) => `${v.total} में से ${v.tested} जाँचें उपलब्ध; इनमें कुछ रीडिंग अनुपलब्ध हैं।`,
  },
}

export const ACTION_TEXT: Record<Lang, Record<ActionCode, { title: string; detail: string }>> = {
  en: {
    AERATE_TEST: { title: 'Aerate + send test team', detail: 'Place aerators before immersion and send an MPPCB sampling team for before, during and after tests.' },
    TEST_FIRST: { title: 'Send test team first', detail: 'No test from Durga 2025. Sample before, during and one week after immersion on 20 October.' },
    AERATE: { title: 'Aerate during and after', detail: 'Immersion has pulled oxygen below 5 mg/l here. Run aerators on the day and for the following week.' },
    CLEAN_RETEST: { title: 'Extra cleaning + re-test', detail: 'Remove idol material and flowers quickly to cut organic load, and re-test after one week.' },
    ROUTINE: { title: 'Routine cleaning', detail: 'No limit was broken in the tests available. Keep routine cleaning and testing.' },
  },
  hi: {
    AERATE_TEST: { title: 'एरेटर लगाएँ + जाँच दल भेजें', detail: 'विसर्जन से पहले एरेटर लगाएँ और पहले, दौरान और बाद की जाँच के लिए MPPCB दल भेजें।' },
    TEST_FIRST: { title: 'पहले जाँच दल भेजें', detail: 'दुर्गा 2025 की कोई जाँच नहीं। 20 अक्टूबर को विसर्जन से पहले, दौरान और एक सप्ताह बाद नमूना लें।' },
    AERATE: { title: 'विसर्जन के दौरान और बाद एरेटर', detail: 'यहाँ विसर्जन से ऑक्सीजन 5 mg/l से नीचे गई है। उस दिन और अगले सप्ताह एरेटर चलाएँ।' },
    CLEAN_RETEST: { title: 'अतिरिक्त सफ़ाई + पुनः जाँच', detail: 'जैविक भार घटाने के लिए मूर्ति-सामग्री और फूल जल्दी निकालें, एक सप्ताह बाद फिर जाँचें।' },
    ROUTINE: { title: 'नियमित सफ़ाई', detail: 'उपलब्ध जाँचों में कोई सीमा नहीं टूटी। नियमित सफ़ाई और जाँच जारी रखें।' },
  },
}

export function reasonText(r: Reason, lang: Lang = 'en'): string {
  return REASON_TEXT[lang][r.code]?.(r.values) ?? r.code
}
