import type { Category } from "../lib/types";
import type { CulturalMoment } from "./cultural-moments";

let nextId = -1000;
function moment(date: string, title: string, description: string, category: Category, url = "", image = ""): CulturalMoment {
  return { id: nextId--, title, description, date, image, url, category, preset: true };
}

export const BONUS_MEMORIES: CulturalMoment[] = [
  moment("2024-10-30", "The Birth of the Renaissance", "Y2K token launched", "key-event", "https://x.com/y2k_dotcom"),
  moment("2025-11-25", "Y2K Coded — Poster Drop 1", "First Y2K coded product launched - limited edition poster collection.", "key-event", "https://www.y2kcoded.com/", "/Poster 1 .webp"),
  moment("2025-01-21", "Main X Page Banned", "", "key-event", "https://x.com/y2k_dotcom"),
  moment("2026-03-10", "The Renaissance 2.0", "The Rebirth of The Renaissance - Y2K migration to pump.swap", "key-event", "https://x.com/0xMrWzrd/status/2023130698320597469?s=20"),
];
