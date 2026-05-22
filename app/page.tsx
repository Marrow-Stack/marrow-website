import { HeroSection } from "@/components/Hero";
import { RefractiveDock } from "@/components/navbar";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { BlocksShowcaseSection } from "@/components/sections/BlocksShowcaseSection";
import { BundlesSection } from "@/components/sections/BundlesSection";
import { WhatsNextSection } from "@/components/sections/WhatsNextSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen w-full relative font-display">
      <RefractiveDock />
      <HeroSection />
      <FeaturesSection />
      <BlocksShowcaseSection />
      <BundlesSection />
      <WhatsNextSection />
      <Footer />
    </div>
  );
}
