import type { FanClubId } from "../../app.types";

/** شعارات الأندية السعودية — ملفات محلية في assets/clubs/saudi */
export const SAUDI_CLUB_EMBLEMS: Partial<Record<FanClubId, number>> = {
  hilal: require("../../../assets/clubs/saudi/hilal.png"),
  nassr: require("../../../assets/clubs/saudi/nassr.png"),
  ittihad: require("../../../assets/clubs/saudi/ittihad.png"),
  ahli: require("../../../assets/clubs/saudi/ahli.png"),
  shabab: require("../../../assets/clubs/saudi/shabab.png"),
  ittefaq: require("../../../assets/clubs/saudi/ittefaq.png"),
  qadisiyah: require("../../../assets/clubs/saudi/qadisiyah.png"),
  raed: require("../../../assets/clubs/saudi/raed.png"),
  fayha: require("../../../assets/clubs/saudi/fayha.png"),
  damak: require("../../../assets/clubs/saudi/damak.png"),
  tai: require("../../../assets/clubs/saudi/tai.png"),
  khaleej: require("../../../assets/clubs/saudi/khaleej.png"),
  abha: require("../../../assets/clubs/saudi/abha.png"),
  taawun: require("../../../assets/clubs/saudi/taawun.png"),
  fateh: require("../../../assets/clubs/saudi/fateh.png"),
  wehda: require("../../../assets/clubs/saudi/wehda.png"),
};

export function getSaudiClubEmblem(clubId: FanClubId) {
  return SAUDI_CLUB_EMBLEMS[clubId];
}
