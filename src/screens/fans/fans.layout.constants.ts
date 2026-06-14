/** إيقاف اللسان مؤقتاً — أعد true لإرجاعه. */
export const FANS_TONGUE_ENABLED = true;

/** Space for BottomNav dock in AppShell (approx. bar + padding). */
export const FANS_BOTTOM_NAV_RESERVE = 78;

/** Space for the community composer above bottom nav. */
export const FANS_COMPOSER_HEIGHT = 50;

/** مسافة علوية صغيرة داخل الهيدر الثابت. */
export const FANS_STICKY_HEADER_TOP = 8;

/** أبعاد اللسان المطوي — للحجز في التخطيط فقط. */
export const FANS_TONGUE_COLLAPSED_BAR_HEIGHT = 38;
export const FANS_TONGUE_COLLAPSED_LOGO_FLOAT = 10;
export const FANS_TONGUE_RESERVED_HEIGHT =
  FANS_TONGUE_COLLAPSED_BAR_HEIGHT + FANS_TONGUE_COLLAPSED_LOGO_FLOAT + 4;

/** المنسدلة — نسب من مساحة الصفحة الرئيسية. */
export const FANS_TONGUE_DROPDOWN_WIDTH_RATIO = 0.9;
export const FANS_TONGUE_DROPDOWN_HEIGHT_RATIO = 0.7;
export const FANS_TONGUE_PAGE_SHELL_WIDTH = 430;

/** أبعاد هيرو الرابطة — للحجز في التخطيط فقط. */
export const FANS_HERO_PADDING_TOP = 22;
export const FANS_HERO_PADDING_BOTTOM = 8;
export const FANS_HERO_META_MIN_HEIGHT = 34;
export const FANS_HERO_RESERVED_HEIGHT =
  FANS_HERO_PADDING_TOP + FANS_HERO_META_MIN_HEIGHT + FANS_HERO_PADDING_BOTTOM;

/** ارتفاع الهيدر الثابت: اللسان + الهيرو. */
export const FANS_STICKY_HEADER_HEIGHT =
  FANS_STICKY_HEADER_TOP +
  (FANS_TONGUE_ENABLED ? FANS_TONGUE_RESERVED_HEIGHT : 0) +
  FANS_HERO_RESERVED_HEIGHT;

/** بداية التعليقات تحت الهيدر الثابت. */
export const FANS_FEED_TOP_PADDING = FANS_STICKY_HEADER_HEIGHT + 6;

/** مسافة أسفل التغذية (مثل xScreenContent paddingBottom). */
export const FANS_SCROLL_BOTTOM_PADDING = 120;
