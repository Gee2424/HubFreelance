import MainNav from "@/components/navigation/MainNav";
import HeroSection from "@/components/home/HeroSection";
import JobCategories from "@/components/home/JobCategories";
import FeaturedJobs from "@/components/home/FeaturedJobs";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import CtaSection from "@/components/home/CtaSection";
import Footer from "@/components/ui/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <main className="flex-grow">
        <HeroSection />
        <JobCategories />
        <FeaturedJobs />
        <HowItWorks />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
