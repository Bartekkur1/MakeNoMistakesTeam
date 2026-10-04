import { Faq } from "./_landing/Faq";
import { Hero } from "./_landing/Hero";
import { HowItWorks } from "./_landing/HowItWorks";
import { Install } from "./_landing/Install";
import { Parents } from "./_landing/Parents";
import { Scams } from "./_landing/Scams";
import { Schools } from "./_landing/Schools";
import { SiteFooter } from "./_landing/SiteFooter";
import { SiteHeader } from "./_landing/SiteHeader";
import { Stats } from "./_landing/Stats";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Scams />
        <HowItWorks />
        <Parents />
        <Schools />
        <Faq />
        <Install />
      </main>
      <SiteFooter />
    </>
  );
}
