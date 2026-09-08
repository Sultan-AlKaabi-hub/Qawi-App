/* =============================================================================
   i18n.js — bilingual runtime (English / العربية) with full RTL mirroring
   -----------------------------------------------------------------------------
   Design decisions:
   • Dictionary ships inside the bundle (not fetched) so language switching works
     offline and costs zero network — a hard requirement for an offline-first PWA.
   • Direction is driven by <html dir>. All layout uses CSS logical properties,
     so no mirrored stylesheet exists. Ref: W3C i18n "Structural markup and RTL".
   • Arabic uses Latin digits (locale ar-AE-u-nu-latn). Arabic-Indic numerals are
     correct in many contexts, but UAE fitness/wearable apps overwhelmingly show
     Latin digits for metrics; consistency with wearables was the deciding factor.
     Change NUMERIC_LOCALE below to "ar-AE" to switch to ٠١٢٣ digits.
   • Language is applied before first paint by the inline bootstrap in each page
     <head>, which prevents a flash of the wrong direction (FOUD).
   ========================================================================== */

const NUMERIC_LOCALE = { en: 'en-AE', ar: 'ar-AE-u-nu-latn' };

export const DICT = {
  en: {
    'app.name': 'Qawi',
    'app.tagline': 'Train. Log it. See the load.',

    'nav.home': 'Home',
    'nav.train': 'Train',
    'nav.record': 'Record',
    'nav.routes': 'Routes',
    'nav.you': 'You',

    'a11y.skip': 'Skip to main content',
    'a11y.back': 'Go back',
    'a11y.settings': 'Open settings',
    'a11y.lang': 'Change language',
    'a11y.primary': 'Primary',

    'common.done': 'Done',
    'common.start': 'Start',
    'common.finish': 'Finish session',
    'common.seeAll': 'See all',
    'common.min': 'min',
    'common.kg': 'kg',
    'common.lb': 'lb',
    'common.km': 'km',
    'common.m': 'm',
    'common.exercises': 'exercises',
    'common.all': 'All',
    'common.today': 'Today',
    'common.rest': 'Rest',
    'common.offline': 'You are offline. Everything you log is saved on this device and syncs when you reconnect.',
    'common.install': 'Install Qawi',
    'common.installed': 'Qawi is installed on this device.',

    'home.greetMorning': 'Good morning',
    'home.greetAfternoon': 'Good afternoon',
    'home.greetEvening': 'Good evening',
    'home.thisWeek': 'This week',
    'home.volume': 'Total volume',
    'home.sessions': 'Sessions',
    'home.time': 'Time trained',
    'home.sets': 'Total sets',
    'home.next': 'Next session',
    'home.nextHint': 'From your 12-week plan',
    'home.startNow': 'Start session',
    'home.recent': 'Recent activity',
    'home.noActivity': 'Nothing logged yet',
    'home.noActivityHint': 'Finish one session and your load map fills in.',
    'home.weeklyGoal': 'Weekly goal',
    'home.goalOf': 'of',

    'train.title': 'Routines',
    'train.subtitle': 'Pick a session and start lifting',
    'train.push': 'Push',
    'train.pull': 'Pull',
    'train.legs': 'Legs',
    'train.full': 'Full body',
    'train.core': 'Core',
    'train.estimated': 'about',
    'train.targets': 'Targets',

    'workout.exerciseOf': 'Exercise {0} of {1}',
    'workout.recommended': 'Suggested weight',
    'workout.repsCaption': 'Reps to do',
    'workout.restCaption': 'Rest',
    'workout.setsCaption': 'Sets done',
    'workout.logSet': 'Log set',
    'workout.skipRest': 'Skip rest',
    'workout.next': 'Next exercise',
    'workout.prev': 'Previous exercise',
    'workout.howTo': 'How to do it',
    'workout.setLogged': 'Set logged',
    'workout.sessionSaved': 'Session saved',
    'workout.elapsed': 'Elapsed',
    'workout.confirmFinish': 'Finish and save this session?',
    'workout.resting': 'Resting',

    'plan.title': 'Schedule plan',
    'plan.dates': 'Choose your start and end date',
    'plan.datesHint': 'A plan runs for at least 12 weeks.',
    'plan.start': 'Start',
    'plan.end': 'End',
    'plan.daysQ': 'Which days will you train?',
    'plan.daysHint': 'Four days a week works best. Pick 3 to 4.',
    'plan.longQ': 'Your long session needs a day with time around it.',
    'plan.long': 'Long session',
    'plan.reminders': 'Training day reminders',
    'plan.enableReminder': 'Remind me',
    'plan.reminderTime': 'Reminder time',
    'plan.tooFewDays': 'Pick at least 3 training days.',
    'plan.tooManyDays': 'Pick no more than 4 training days.',
    'plan.tooShort': 'The end date must be at least 12 weeks after the start.',
    'plan.longMustTrain': 'The long session has to fall on a training day.',
    'plan.savedMsg': 'Plan saved. Your next session is on {0}.',
    'plan.weeks': '{0} weeks',

    'routes.title': 'Routes',
    'routes.search': 'Search routes',
    'routes.filterRoutes': 'Routes',
    'routes.length': 'Length',
    'routes.elevation': 'Elevation',
    'routes.surface': 'Surface',
    'routes.count': '{0} routes',
    'routes.madeForYou': 'Made for you',
    'routes.fromLocation': 'From your location',
    'routes.saved': 'Saved',
    'routes.save': 'Save route',
    'routes.unsave': 'Remove from saved',
    'routes.offlineNote': 'Saved routes work offline. New search needs a connection.',
    'routes.ride': 'Ride',
    'routes.run': 'Run',

    'you.title': 'You',
    'you.load': 'Muscle load',
    'you.loadHint': 'Last 7 days of logged sets, by muscle group.',
    'you.front': 'Front',
    'you.back': 'Back',
    'you.less': 'Less',
    'you.more': 'More',
    'you.lifetime': 'Lifetime',
    'you.settings': 'Settings',
    'you.language': 'Language',
    'you.theme': 'Dark theme',
    'you.units': 'Weight units',
    'you.reduceMotion': 'Reduce motion',
    'you.reduceMotionHint': 'Turns off timers and progress animation.',
    'you.data': 'Your data',
    'you.export': 'Export my data',
    'you.clear': 'Delete all data',
    'you.clearConfirm': 'Delete every session, plan and setting on this device? This cannot be undone.',
    'you.cleared': 'All data deleted',
    'you.storage': 'Stored on this device',
    'you.noMuscleData': 'Log a session to see which muscles carried the load.',

    'offline.title': 'No connection',
    'offline.body': 'This page has not been saved for offline use yet. Your sessions, plan and saved routes are still available.',
    'offline.retry': 'Try again',
    'offline.goHome': 'Go to Home',
  },

  ar: {
    'app.name': 'قوي',
    'app.tagline': 'تمرّن. سجّل. شاهد الحِمل.',

    'nav.home': 'الرئيسية',
    'nav.train': 'التمارين',
    'nav.record': 'تسجيل',
    'nav.routes': 'المسارات',
    'nav.you': 'حسابي',

    'a11y.skip': 'تخطَّ إلى المحتوى الرئيسي',
    'a11y.back': 'رجوع',
    'a11y.settings': 'فتح الإعدادات',
    'a11y.lang': 'تغيير اللغة',
    'a11y.primary': 'التنقّل الرئيسي',

    'common.done': 'تم',
    'common.start': 'ابدأ',
    'common.finish': 'إنهاء الجلسة',
    'common.seeAll': 'عرض الكل',
    'common.min': 'دقيقة',
    'common.kg': 'كجم',
    'common.lb': 'رطل',
    'common.km': 'كم',
    'common.m': 'م',
    'common.exercises': 'تمارين',
    'common.all': 'الكل',
    'common.today': 'اليوم',
    'common.rest': 'راحة',
    'common.offline': 'أنت غير متصل. كل ما تسجّله محفوظ على هذا الجهاز وسيُزامَن عند عودة الاتصال.',
    'common.install': 'تثبيت قوي',
    'common.installed': 'تطبيق قوي مثبّت على هذا الجهاز.',

    'home.greetMorning': 'صباح الخير',
    'home.greetAfternoon': 'مساء الخير',
    'home.greetEvening': 'مساء الخير',
    'home.thisWeek': 'هذا الأسبوع',
    'home.volume': 'الحِمل الكلي',
    'home.sessions': 'الجلسات',
    'home.time': 'وقت التمرين',
    'home.sets': 'مجموع المجموعات',
    'home.next': 'الجلسة القادمة',
    'home.nextHint': 'من خطتك لاثني عشر أسبوعًا',
    'home.startNow': 'ابدأ الجلسة',
    'home.recent': 'النشاط الأخير',
    'home.noActivity': 'لا يوجد تسجيل بعد',
    'home.noActivityHint': 'أنهِ جلسة واحدة لتظهر خريطة الحِمل لديك.',
    'home.weeklyGoal': 'هدف الأسبوع',
    'home.goalOf': 'من',

    'train.title': 'البرامج',
    'train.subtitle': 'اختر جلسة وابدأ الرفع',
    'train.push': 'دفع',
    'train.pull': 'سحب',
    'train.legs': 'أرجل',
    'train.full': 'الجسم كامل',
    'train.core': 'وسط الجسم',
    'train.estimated': 'نحو',
    'train.targets': 'العضلات المستهدفة',

    'workout.exerciseOf': 'التمرين {0} من {1}',
    'workout.recommended': 'الوزن المقترح',
    'workout.repsCaption': 'التكرارات المطلوبة',
    'workout.restCaption': 'الراحة',
    'workout.setsCaption': 'المجموعات المنجزة',
    'workout.logSet': 'تسجيل المجموعة',
    'workout.skipRest': 'تخطّي الراحة',
    'workout.next': 'التمرين التالي',
    'workout.prev': 'التمرين السابق',
    'workout.howTo': 'طريقة الأداء',
    'workout.setLogged': 'تم تسجيل المجموعة',
    'workout.sessionSaved': 'تم حفظ الجلسة',
    'workout.elapsed': 'الزمن المنقضي',
    'workout.confirmFinish': 'هل تريد إنهاء الجلسة وحفظها؟',
    'workout.resting': 'راحة',

    'plan.title': 'جدولة الخطة',
    'plan.dates': 'اختر تاريخ البداية والنهاية',
    'plan.datesHint': 'مدة الخطة اثنا عشر أسبوعًا على الأقل.',
    'plan.start': 'البداية',
    'plan.end': 'النهاية',
    'plan.daysQ': 'في أي أيام ستتمرّن؟',
    'plan.daysHint': 'أربعة أيام أسبوعيًا هي الأفضل. اختر من ٣ إلى ٤ أيام.',
    'plan.longQ': 'الجلسة الطويلة تحتاج يومًا لديك فيه وقت كافٍ.',
    'plan.long': 'الجلسة الطويلة',
    'plan.reminders': 'تذكير بأيام التمرين',
    'plan.enableReminder': 'ذكّرني',
    'plan.reminderTime': 'وقت التذكير',
    'plan.tooFewDays': 'اختر ثلاثة أيام تمرين على الأقل.',
    'plan.tooManyDays': 'لا تختر أكثر من أربعة أيام تمرين.',
    'plan.tooShort': 'يجب أن يكون تاريخ النهاية بعد البداية باثني عشر أسبوعًا على الأقل.',
    'plan.longMustTrain': 'يجب أن تقع الجلسة الطويلة في يوم تمرين.',
    'plan.savedMsg': 'تم حفظ الخطة. جلستك القادمة يوم {0}.',
    'plan.weeks': '{0} أسبوعًا',

    'routes.title': 'المسارات',
    'routes.search': 'ابحث عن مسار',
    'routes.filterRoutes': 'المسارات',
    'routes.length': 'المسافة',
    'routes.elevation': 'الارتفاع',
    'routes.surface': 'نوع الأرض',
    'routes.count': '{0} مسارات',
    'routes.madeForYou': 'مختار لك',
    'routes.fromLocation': 'من موقعك',
    'routes.saved': 'محفوظ',
    'routes.save': 'حفظ المسار',
    'routes.unsave': 'إزالة من المحفوظات',
    'routes.offlineNote': 'المسارات المحفوظة تعمل بدون إنترنت. البحث الجديد يحتاج اتصالًا.',
    'routes.ride': 'دراجة',
    'routes.run': 'جري',

    'you.title': 'حسابي',
    'you.load': 'حِمل العضلات',
    'you.loadHint': 'مجموعاتك المسجّلة في آخر سبعة أيام، حسب المجموعة العضلية.',
    'you.front': 'أمامي',
    'you.back': 'خلفي',
    'you.less': 'أقل',
    'you.more': 'أكثر',
    'you.lifetime': 'الإجمالي',
    'you.settings': 'الإعدادات',
    'you.language': 'اللغة',
    'you.theme': 'الوضع الداكن',
    'you.units': 'وحدة الوزن',
    'you.reduceMotion': 'تقليل الحركة',
    'you.reduceMotionHint': 'يوقف حركة المؤقتات وأشرطة التقدّم.',
    'you.data': 'بياناتك',
    'you.export': 'تصدير بياناتي',
    'you.clear': 'حذف كل البيانات',
    'you.clearConfirm': 'هل تريد حذف كل الجلسات والخطط والإعدادات على هذا الجهاز؟ لا يمكن التراجع.',
    'you.cleared': 'تم حذف كل البيانات',
    'you.storage': 'محفوظ على هذا الجهاز',
    'you.noMuscleData': 'سجّل جلسة لترى العضلات التي حملت الجهد.',

    'offline.title': 'لا يوجد اتصال',
    'offline.body': 'هذه الصفحة لم تُحفَظ للعمل بدون إنترنت بعد. جلساتك وخطتك ومساراتك المحفوظة ما زالت متاحة.',
    'offline.retry': 'حاول مرة أخرى',
    'offline.goHome': 'الذهاب إلى الرئيسية',
  },
};

export const LANGS = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];

let current = 'en';

/** Read the persisted language, falling back to the browser's preference. */
export function detectLang() {
  const stored = localStorage.getItem('qawi.lang');
  if (stored && DICT[stored]) return stored;
  const nav = (navigator.languages || [navigator.language || 'en'])[0] || 'en';
  return nav.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

export function getLang() { return current; }
export function getDir()  { return current === 'ar' ? 'rtl' : 'ltr'; }

/** Translate a key. Positional {0}, {1} placeholders are substituted in order. */
export function t(key, ...args) {
  const table = DICT[current] || DICT.en;
  let s = table[key] ?? DICT.en[key] ?? key;
  args.forEach((v, i) => { s = s.replaceAll(`{${i}}`, v); });
  return s;
}

export const fmt = {
  num(n, opts = {}) { return new Intl.NumberFormat(NUMERIC_LOCALE[current], opts).format(n); },
  date(d, opts = { day: 'numeric', month: 'short' }) {
    return new Intl.DateTimeFormat(NUMERIC_LOCALE[current], opts).format(new Date(d));
  },
  weekday(index, style = 'short') {
    // index 0 = Sunday, matching the plan grid in the reference design.
    const base = new Date(Date.UTC(2024, 8, 1 + index)); // 2024-09-01 was a Sunday
    return new Intl.DateTimeFormat(NUMERIC_LOCALE[current], { weekday: style, timeZone: 'UTC' }).format(base);
  },
  /** Seconds -> m:ss, always with Latin-or-locale digits and no jitter. */
  clock(totalSeconds) {
    const s = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(s / 60);
    return `${this.num(m)}:${String(s % 60).padStart(2, '0')}`;
  },
  duration(minutes) { return `${this.num(Math.round(minutes))} ${t('common.min')}`; },
};

/**
 * Apply a language to the document: set lang/dir, then translate every node
 * carrying data-i18n / data-i18n-attr. Idempotent — safe to call repeatedly.
 */
export function applyLang(lang) {
  current = DICT[lang] ? lang : 'en';
  localStorage.setItem('qawi.lang', current);

  const html = document.documentElement;
  html.lang = current;
  html.dir = getDir();

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  // data-i18n-attr="placeholder:routes.search, aria-label:a11y.back"
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });

  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: current } }));
}

export function toggleLang() {
  applyLang(current === 'en' ? 'ar' : 'en');
}
