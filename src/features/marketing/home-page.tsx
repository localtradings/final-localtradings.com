import { homeCopy } from "@/content/marketing/site-copy";
import {
  BATTLE_OPEN_ROOM_MAX_PLAYERS,
  BATTLE_OPEN_ROOM_DURATION_MINUTES,
  BATTLE_PRIVATE_DURATION_MINUTES,
} from "@/features/battle/constants";
import { moduleCatalog } from "@/content/modules";
import { quizCatalog } from "@/content/quizzes";
import {
  MarketingBattleSpotlightSection,
  MarketingFeatureGridSection,
  MarketingHeroSection,
  MarketingHomeCtaSection,
  MarketingSupportModesSection,
} from "@/features/marketing/home-page-sections";

const battleDurationCount = new Set([
  ...BATTLE_PRIVATE_DURATION_MINUTES,
  ...BATTLE_OPEN_ROOM_DURATION_MINUTES,
]).size;

export function MarketingHomePage() {
  const lessonCount = moduleCatalog.reduce(
    (total, module) => total + module.lessonSlugs.length,
    0,
  );
  return (
    <main className="theme-marketing theme-home relative overflow-hidden pb-24">
      <div className="relative z-10">
        <MarketingHeroSection copy={homeCopy} />
        <MarketingFeatureGridSection
          copy={homeCopy}
          lessonCount={lessonCount}
          moduleCount={moduleCatalog.length}
          quizCount={quizCatalog.length}
        />
        <MarketingBattleSpotlightSection
          copy={homeCopy}
          battleDurationCount={battleDurationCount}
          openRoomMaxPlayers={BATTLE_OPEN_ROOM_MAX_PLAYERS}
        />
        <MarketingSupportModesSection
          copy={homeCopy}
          lessonCount={lessonCount}
          moduleCount={moduleCatalog.length}
          quizCount={quizCatalog.length}
        />
        <MarketingHomeCtaSection copy={homeCopy} />
      </div>
    </main>
  );
}
