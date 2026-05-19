import { HeroSection } from "@/components/Hero";
import { RefractiveDock } from "@/components/navbar";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { BlocksShowcase } from "@/components/sections/BlocksShowcase";
import { PricingSection } from "@/components/sections/PricingSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen w-full relative font-display">
      <RefractiveDock />
      <HeroSection />
      <FeaturesSection />
      <BlocksShowcase />
      <PricingSection />
      <Footer />
    </div>
  );
}
