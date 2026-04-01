import { homeCopy } from "@/content/marketing/site-copy";
import { moduleCatalog } from "@/content/modules";
import { quizCatalog } from "@/content/quizzes";
import {
  MarketingBacktestingSection,
  MarketingCapabilitiesSection,
  MarketingCrossPlatformSection,
  MarketingCurriculumSection,
  MarketingHeroSection,
  MarketingHomeCtaSection,
  MarketingQuizSection,
  MarketingWhyLearnSection,
} from "@/features/marketing/home-page-sections";

export function MarketingHomePage() {
  const featuredModule = moduleCatalog[0];
  const featuredQuiz = quizCatalog[0];

  return (
    <main className="theme-marketing theme-home relative overflow-hidden pb-24">
      <div className="relative z-10">
        <MarketingHeroSection copy={homeCopy} />
        <MarketingCrossPlatformSection featuredModule={featuredModule} />
        <MarketingCapabilitiesSection copy={homeCopy} quizCount={quizCatalog.length} />
        <MarketingQuizSection featuredQuiz={featuredQuiz} quizCount={quizCatalog.length} />
        <MarketingBacktestingSection />
        <MarketingCurriculumSection modules={moduleCatalog} />
        <MarketingWhyLearnSection />
        <MarketingHomeCtaSection />
      </div>
    </main>
  );
}
