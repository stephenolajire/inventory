import FeaturesSection from "../components/landing/Feature"
import HeroSection from "../components/landing/Hero"
import HowItWorksSection from "../components/landing/HowItWorks"
import PricingSection from "../components/landing/Pricing"
import TestimonialsSection from "../components/landing/Testimonial"


const Landing = () => {
  return (
    <main>
      <HeroSection/>
      <FeaturesSection/>
      <HowItWorksSection/>
      <PricingSection/>
      <TestimonialsSection/>
    </main>
  )
}

export default Landing
