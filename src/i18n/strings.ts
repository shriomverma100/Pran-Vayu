// Interface text in English and Hindi. The platform name प्राण-वायु is never
// translated; everything else switches with the language toggle.

const en = {
  // status of a reading against the CPCB limit
  'status.severe': 'Severe',
  'status.breach': 'Breaks limit',
  'status.within': 'Within limit',
  'status.notTested': 'Not tested',
  'status.bdl': 'Below detection',
  'status.noLimit': 'No limit set',
  'status.severe.hint': 'Far past the limit: oxygen below 2 mg/l, or BOD at twice the limit or more',
  'status.breach.hint': 'Breaks the CPCB Class B outdoor-bathing limit',
  'status.within.hint': 'Meets the CPCB Class B outdoor-bathing limit',
  'status.notTested.hint': 'No reading in the report. Missing is never treated as clean',
  'status.bdl.hint': 'Below the detection limit: very low, but not zero and not missing',
  'status.noLimit.hint': 'CPCB sets no Class B limit for this test',

  // tiers
  'tier.act-now': 'Act now',
  'tier.high': 'High',
  'tier.moderate': 'Moderate',

  // stability
  'stability.stable': 'Rank stable',
  'stability.varies': 'Rank varies',
  'stability.detail': 'Rank {best}–{worst} across {n} scoring choices',
  'stability.always': '#{rank} in all {n} scoring choices',

  // coverage
  'coverage.label': '{tested} of {total} tests',
  'coverage.tested': 'Tested',
  'coverage.partial': 'Partly tested',
  'coverage.noTable': 'Not tested: no table in the report',
  'coverage.notSampled': 'Not tested: marked not sampled',

  // phases
  'phase.pre': 'Before',
  'phase.during': 'During',
  'phase.after': 'After 1 week',
  'festival.Ganesh': 'Ganesh',
  'festival.Durga': 'Durga',

  // common UI
  'ui.verify': 'Verify in report',
  'ui.verify.page': '{report}, page {page}',
  'ui.close': 'Close',
  'ui.copy': 'Copy',
  'ui.copied': 'Copied',
  'ui.print': 'Print',
  'ui.download': 'Download PDF',
  'ui.share': 'Share on WhatsApp',
  'ui.language': 'Language',
  'ui.textSize': 'Text size',
  'ui.skip': 'Skip to main content',
  'days.left': 'days to Durga visarjan',
  'days.one': 'day to Durga visarjan',
  'days.today': 'Durga visarjan is today',
  'days.past': 'Durga visarjan 2026 has passed',
} as const

export type StringKey = keyof typeof en

const hi: Record<StringKey, string> = {
  'status.severe': 'गंभीर',
  'status.breach': 'सीमा से बाहर',
  'status.within': 'सीमा के भीतर',
  'status.notTested': 'जाँच नहीं हुई',
  'status.bdl': 'पहचान-सीमा से कम',
  'status.noLimit': 'कोई सीमा तय नहीं',
  'status.severe.hint': 'सीमा से बहुत दूर: ऑक्सीजन 2 mg/l से कम, या BOD सीमा का दोगुना या अधिक',
  'status.breach.hint': 'CPCB श्रेणी B (खुले में स्नान) की सीमा टूटी',
  'status.within.hint': 'CPCB श्रेणी B (खुले में स्नान) की सीमा के भीतर',
  'status.notTested.hint': 'रिपोर्ट में कोई रीडिंग नहीं। जाँच न होने को कभी साफ़ नहीं माना जाता',
  'status.bdl.hint': 'पहचान-सीमा से कम: बहुत कम, पर शून्य नहीं और अनुपलब्ध भी नहीं',
  'status.noLimit.hint': 'इस जाँच के लिए CPCB ने श्रेणी B सीमा तय नहीं की',

  'tier.act-now': 'तुरंत कार्य',
  'tier.high': 'उच्च',
  'tier.moderate': 'मध्यम',

  'stability.stable': 'रैंक स्थिर',
  'stability.varies': 'रैंक बदलती है',
  'stability.detail': '{n} स्कोरिंग विकल्पों में रैंक {best}–{worst}',
  'stability.always': 'सभी {n} स्कोरिंग विकल्पों में #{rank}',

  'coverage.label': '{total} में से {tested} जाँचें',
  'coverage.tested': 'जाँच हुई',
  'coverage.partial': 'आंशिक जाँच',
  'coverage.noTable': 'जाँच नहीं: रिपोर्ट में तालिका नहीं',
  'coverage.notSampled': 'जाँच नहीं: नमूना नहीं लिया गया',

  'phase.pre': 'पहले',
  'phase.during': 'दौरान',
  'phase.after': '1 सप्ताह बाद',
  'festival.Ganesh': 'गणेश',
  'festival.Durga': 'दुर्गा',

  'ui.verify': 'रिपोर्ट में जाँचें',
  'ui.verify.page': '{report}, पृष्ठ {page}',
  'ui.close': 'बंद करें',
  'ui.copy': 'कॉपी करें',
  'ui.copied': 'कॉपी हो गया',
  'ui.print': 'प्रिंट करें',
  'ui.download': 'PDF डाउनलोड करें',
  'ui.share': 'WhatsApp पर भेजें',
  'ui.language': 'भाषा',
  'ui.textSize': 'अक्षर का आकार',
  'ui.skip': 'मुख्य सामग्री पर जाएँ',
  'days.left': 'दिन दुर्गा विसर्जन में',
  'days.one': 'दिन दुर्गा विसर्जन में',
  'days.today': 'दुर्गा विसर्जन आज है',
  'days.past': 'दुर्गा विसर्जन 2026 बीत चुका है',
}

export const STRINGS: Record<'en' | 'hi', Record<StringKey, string>> = { en, hi }
