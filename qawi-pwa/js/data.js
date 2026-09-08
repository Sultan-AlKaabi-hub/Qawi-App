/* =============================================================================
   data.js — the content model
   -----------------------------------------------------------------------------
   Content is bilingual at the field level ({ en, ar }) rather than duplicated
   per language file. One record = one exercise, in every language it ships in,
   so translations can never drift out of sync with structure.
   In production this file becomes a cached JSON endpoint; the shape is unchanged.
   ========================================================================== */

/** Canonical muscle ids — these are the SVG element ids in the body map. */
export const MUSCLES = {
  chest:      { en: 'Chest',        ar: 'الصدر' },
  shoulders:  { en: 'Shoulders',    ar: 'الأكتاف' },
  biceps:     { en: 'Biceps',       ar: 'العضلة ذات الرأسين' },
  triceps:    { en: 'Triceps',      ar: 'العضلة ثلاثية الرؤوس' },
  forearms:   { en: 'Forearms',     ar: 'الساعدان' },
  abs:        { en: 'Abs',          ar: 'البطن' },
  obliques:   { en: 'Obliques',     ar: 'الجانبيّة' },
  traps:      { en: 'Traps',        ar: 'شبه المنحرفة' },
  lats:       { en: 'Lats',         ar: 'الظهر العريضة' },
  lowerback:  { en: 'Lower back',   ar: 'أسفل الظهر' },
  glutes:     { en: 'Glutes',       ar: 'الأرداف' },
  quads:      { en: 'Quads',        ar: 'الفخذ الأمامية' },
  hamstrings: { en: 'Hamstrings',   ar: 'الفخذ الخلفية' },
  calves:     { en: 'Calves',       ar: 'السمانة' },
};

export const EXERCISES = {
  db_bench_pullover: {
    name: { en: 'Dumbbell bench pullover', ar: 'سحب الدمبل فوق الرأس على المقعد' },
    muscles: ['chest', 'lats', 'triceps'],
    reps: 15, sets: 3, restSec: 60, weightKg: 12,
    cue: {
      en: 'Lie flat, arms nearly straight. Lower the bell behind your head only as far as your ribs stay down, then pull it back over your chest.',
      ar: 'استلقِ على ظهرك والذراعان شبه ممدودتين. أنزل الدمبل خلف رأسك بقدر ما يبقى القفص الصدري ثابتًا، ثم اسحبه فوق صدرك.',
    },
  },
  incline_db_press: {
    name: { en: 'Incline dumbbell press', ar: 'ضغط الدمبل على المقعد المائل' },
    muscles: ['chest', 'shoulders', 'triceps'],
    reps: 10, sets: 4, restSec: 90, weightKg: 20,
    cue: {
      en: 'Bench at 30 degrees. Press until the bells meet over the collarbone, elbows tucked to about 45 degrees.',
      ar: 'اضبط المقعد على ٣٠ درجة. ادفع حتى يلتقي الدمبلان فوق عظمة الترقوة مع إبقاء المرفقين قرب ٤٥ درجة.',
    },
  },
  overhead_press: {
    name: { en: 'Standing overhead press', ar: 'الضغط العلوي وقوفًا' },
    muscles: ['shoulders', 'triceps', 'abs'],
    reps: 8, sets: 4, restSec: 105, weightKg: 35,
    cue: {
      en: 'Squeeze the glutes, ribs down. Push the bar past your forehead, then bring your head through at lockout.',
      ar: 'اشدّ الأرداف وثبّت القفص الصدري. ادفع البار فوق جبهتك ثم أدخل رأسك للأمام عند الامتداد الكامل.',
    },
  },
  cable_triceps: {
    name: { en: 'Cable triceps pushdown', ar: 'دفع الحبل للعضلة ثلاثية الرؤوس' },
    muscles: ['triceps'],
    reps: 12, sets: 3, restSec: 45, weightKg: 25,
    cue: {
      en: 'Elbows pinned to your sides. Only the forearm moves; pause one second at the bottom.',
      ar: 'ثبّت المرفقين بجانبيك. الساعد وحده يتحرك، وتوقّف ثانية واحدة في الأسفل.',
    },
  },
  lat_pulldown: {
    name: { en: 'Lat pulldown', ar: 'سحب البكرة العلوية' },
    muscles: ['lats', 'biceps', 'traps'],
    reps: 12, sets: 4, restSec: 75, weightKg: 45,
    cue: {
      en: 'Start with a long stretch overhead. Drive the elbows to the ribs, chest tall throughout.',
      ar: 'ابدأ بمدّ كامل للذراعين لأعلى. اسحب المرفقين نحو الأضلاع مع إبقاء الصدر مرفوعًا.',
    },
  },
  barbell_row: {
    name: { en: 'Barbell row', ar: 'التجديف بالبار' },
    muscles: ['lats', 'traps', 'lowerback', 'biceps'],
    reps: 10, sets: 4, restSec: 90, weightKg: 60,
    cue: {
      en: 'Hinge to about 45 degrees, spine neutral. Pull to the navel, control the bar all the way down.',
      ar: 'انحنِ من الوركين نحو ٤٥ درجة مع استقامة الظهر. اسحب البار إلى السرّة وتحكّم به في النزول.',
    },
  },
  face_pull: {
    name: { en: 'Face pull', ar: 'سحب الحبل نحو الوجه' },
    muscles: ['shoulders', 'traps'],
    reps: 15, sets: 3, restSec: 45, weightKg: 20,
    cue: {
      en: 'Pull the rope to your eyebrows, hands wide, thumbs back. This is a control exercise, not a heavy one.',
      ar: 'اسحب الحبل نحو حاجبيك واليدان متباعدتان والإبهامان للخلف. هذا تمرين تحكّم لا تمرين أوزان ثقيلة.',
    },
  },
  back_squat: {
    name: { en: 'Back squat', ar: 'القرفصاء بالبار الخلفي' },
    muscles: ['quads', 'glutes', 'lowerback', 'abs'],
    reps: 6, sets: 5, restSec: 150, weightKg: 80,
    cue: {
      en: 'Brace before you unrack. Sit between the hips, knees tracking over the middle toes.',
      ar: 'شدّ وسطك قبل رفع البار. انزل بين الوركين مع توجيه الركبتين فوق منتصف القدمين.',
    },
  },
  romanian_deadlift: {
    name: { en: 'Romanian deadlift', ar: 'الرفعة الرومانية' },
    muscles: ['hamstrings', 'glutes', 'lowerback'],
    reps: 8, sets: 4, restSec: 120, weightKg: 70,
    cue: {
      en: 'Push the hips back, bar sliding down the thighs. Stop where the hamstrings stop, not where the floor is.',
      ar: 'ادفع الوركين للخلف مع انزلاق البار على الفخذين. توقّف عند حدّ مرونة الفخذ الخلفية لا عند الأرض.',
    },
  },
  walking_lunge: {
    name: { en: 'Walking lunge', ar: 'الطعن أثناء المشي' },
    muscles: ['quads', 'glutes', 'hamstrings', 'calves'],
    reps: 20, sets: 3, restSec: 75, weightKg: 16,
    cue: {
      en: 'Long step, back knee to a hand-width off the floor. Torso stays upright the whole way.',
      ar: 'خطوة واسعة والركبة الخلفية على بعد راحة يد من الأرض، مع بقاء الجذع مستقيمًا.',
    },
  },
  calf_raise: {
    name: { en: 'Standing calf raise', ar: 'رفع السمانة وقوفًا' },
    muscles: ['calves'],
    reps: 15, sets: 4, restSec: 45, weightKg: 40,
    cue: {
      en: 'Full stretch at the bottom, one second squeeze at the top. Do not bounce.',
      ar: 'مدّ كامل في الأسفل وضغط لثانية في الأعلى، دون ارتداد.',
    },
  },
  hanging_leg_raise: {
    name: { en: 'Hanging leg raise', ar: 'رفع الساقين معلّقًا' },
    muscles: ['abs', 'obliques', 'forearms'],
    reps: 12, sets: 3, restSec: 60, weightKg: 0,
    cue: {
      en: 'Start from a dead hang. Curl the pelvis up first, then the legs. Lower slower than you lift.',
      ar: 'ابدأ من تعليق كامل. ارفع الحوض أولًا ثم الساقين، وانزل أبطأ من الرفع.',
    },
  },
  plank_pull: {
    name: { en: 'Plank row', ar: 'التجديف من وضع البلانك' },
    muscles: ['abs', 'obliques', 'lats', 'shoulders'],
    reps: 16, sets: 3, restSec: 60, weightKg: 10,
    cue: {
      en: 'Feet wide for a stable base. Row one bell without letting the hips rotate.',
      ar: 'باعد القدمين لقاعدة ثابتة، وارفع الدمبل بيد واحدة دون دوران الحوض.',
    },
  },
};

export const ROUTINES = [
  {
    id: 'push_a', group: 'push', minutes: 52,
    name: { en: 'Push A — chest and shoulders', ar: 'دفع أ — الصدر والأكتاف' },
    exercises: ['incline_db_press', 'overhead_press', 'db_bench_pullover', 'cable_triceps'],
  },
  {
    id: 'pull_a', group: 'pull', minutes: 48,
    name: { en: 'Pull A — back and biceps', ar: 'سحب أ — الظهر والذراعان' },
    exercises: ['lat_pulldown', 'barbell_row', 'face_pull'],
  },
  {
    id: 'legs_a', group: 'legs', minutes: 61,
    name: { en: 'Legs A — squat focus', ar: 'أرجل أ — تركيز على القرفصاء' },
    exercises: ['back_squat', 'romanian_deadlift', 'walking_lunge', 'calf_raise'],
  },
  {
    id: 'full_a', group: 'full', minutes: 45,
    name: { en: 'Full body — 45 minutes', ar: 'الجسم كامل — ٤٥ دقيقة' },
    exercises: ['back_squat', 'incline_db_press', 'barbell_row', 'hanging_leg_raise'],
  },
  {
    id: 'core_a', group: 'core', minutes: 24,
    name: { en: 'Core finisher', ar: 'ختام لوسط الجسم' },
    exercises: ['hanging_leg_raise', 'plank_pull'],
  },
];

/**
 * Routes. The path strings are normalised to a 0–100 viewBox so the map card
 * can draw them at any size without a tile server — the app stays fully
 * offline-capable and ships no third-party map SDK.
 */
export const ROUTES = [
  {
    id: 'r_corniche', type: 'ride', km: 26.7, elevM: 62, minutes: 129, surface: 'paved',
    name: { en: 'Corniche loop and back', ar: 'دورة الكورنيش والعودة' },
    area: { en: 'Abu Dhabi Corniche', ar: 'كورنيش أبوظبي' },
    forYou: true,
    path: 'M18,84 L24,66 L36,58 L34,44 L46,34 L62,30 L76,38 L80,52 L70,64 L58,62 L52,74 L40,78 Z',
  },
  {
    id: 'r_yas', type: 'ride', km: 31.4, elevM: 88, minutes: 96, surface: 'paved',
    name: { en: 'Yas Marina night circuit', ar: 'حلبة ياس مارينا الليلية' },
    area: { en: 'Yas Island', ar: 'جزيرة ياس' },
    forYou: false,
    path: 'M20,70 C30,40 60,26 78,36 C92,44 88,68 70,74 C52,80 30,88 20,70 Z',
  },
  {
    id: 'r_alwathba', type: 'run', km: 12.1, elevM: 34, minutes: 68, surface: 'gravel',
    name: { en: 'Al Wathba dune track', ar: 'مسار كثبان الوثبة' },
    area: { en: 'Al Wathba', ar: 'الوثبة' },
    forYou: true,
    path: 'M14,78 L28,72 L34,56 L48,52 L54,38 L70,34 L84,44',
  },
  {
    id: 'r_mangrove', type: 'run', km: 8.4, elevM: 9, minutes: 44, surface: 'boardwalk',
    name: { en: 'Eastern Mangroves boardwalk', ar: 'ممشى القرم الشرقي' },
    area: { en: 'Eastern Mangroves', ar: 'القرم الشرقية' },
    forYou: false,
    path: 'M16,60 C34,54 40,72 58,66 C74,60 78,44 88,42',
  },
  {
    id: 'r_jebelhafeet', type: 'ride', km: 44.9, elevM: 1120, minutes: 178, surface: 'paved',
    name: { en: 'Jebel Hafeet climb', ar: 'صعود جبل حفيت' },
    area: { en: 'Al Ain', ar: 'العين' },
    forYou: false,
    path: 'M12,86 L26,80 L22,66 L38,62 L34,48 L50,44 L46,30 L64,26 L60,14 L80,12',
  },
];

export const SURFACES = {
  paved:      { en: 'Paved',      ar: 'معبّد' },
  gravel:     { en: 'Gravel',     ar: 'حصى' },
  boardwalk:  { en: 'Boardwalk',  ar: 'ممشى خشبي' },
};

/** Pick the right language field from a bilingual record. */
export const loc = (field, lang) => (field && (field[lang] ?? field.en)) || '';
