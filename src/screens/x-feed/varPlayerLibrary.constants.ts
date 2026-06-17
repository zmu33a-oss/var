export type VarPlayerLibraryEntry = {
  id: string;
  name: string;
  club: string;
  position: string;
  portraitSeed?: string;
  imageUri?: string;
  fromAppwrite?: boolean;
};

export const VAR_PLAYER_LIBRARY_CLUBS = [
  "الكل",
  "الهلال",
  "النصر",
  "الاتحاد",
  "الأهلي",
  "الشباب",
  "الإتحاد القسنطيني",
  "الوداد",
  "الرجاء",
] as const;

export const VAR_PLAYER_LIBRARY: VarPlayerLibraryEntry[] = [
  { id: "salem", name: "سالم الدوسري", club: "الهلال", position: "وسط", portraitSeed: "salem-dawsari" },
  { id: "mitro", name: "ألكسندر ميتروفيتش", club: "الهلال", position: "مهاجم", portraitSeed: "mitrovic-hilal" },
  { id: "talisca", name: "أندرسون تاليسكا", club: "النصر", position: "وسط", portraitSeed: "talisca-nassr" },
  { id: "ronaldo", name: "كريستيانو رونالدو", club: "النصر", position: "مهاجم", portraitSeed: "ronaldo-nassr" },
  { id: "fabinho", name: "فابينيو", club: "الأهلي", position: "وسط", portraitSeed: "fabinho-ahly" },
  { id: "kessie", name: "فرانك كيسيه", club: "الأهلي", position: "وسط", portraitSeed: "kessie-ahly" },
  { id: "benzema", name: "كريم بنزيما", club: "الاتحاد", position: "مهاجم", portraitSeed: "benzema-ittihad" },
  { id: "kante", name: "نغولو كانتي", club: "الاتحاد", position: "وسط", portraitSeed: "kante-ittihad" },
  { id: "neves", name: "روبن نيفيز", club: "الهلال", position: "وسط", portraitSeed: "neves-hilal" },
  { id: "malcom", name: "مالكوم", club: "النصر", position: "جناح", portraitSeed: "malcom-nassr" },
  { id: "harit", name: "أمين حارث", club: "الشباب", position: "جناح", portraitSeed: "harit-shabab" },
  { id: "banega", name: "إيفر بانيجا", club: "الشباب", position: "وسط", portraitSeed: "banega-shabab" },
  { id: "bounedjah", name: "بغداد بونجاح", club: "الإتحاد القسنطيني", position: "مهاجم", portraitSeed: "bounedjah-csc" },
  { id: "achraf", name: "أشرف داري", club: "الوداد", position: "مدافع", portraitSeed: "dari-wydad" },
];

export const VAR_LIBRARY_BRAND_MARK = "VAR";
export const VAR_LIBRARY_WATERMARK = "مكتبة فار";

export type VarLibraryPublishInput = {
  imageUri: string;
  caption: string;
  playerName: string;
  club: string;
};
