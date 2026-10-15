import Header from '../components/Header.jsx';
import Hero from '../components/Hero.jsx';
import SensoryStrip from '../components/SensoryStrip.jsx';
import Services from '../components/Services.jsx';
import AddOns from '../components/AddOns.jsx';
import WhyUs from '../components/WhyUs.jsx';
import Testimonials from '../components/Testimonials.jsx';
import CtaBanner from '../components/CtaBanner.jsx';
import Faq from '../components/Faq.jsx';
import Footer from '../components/Footer.jsx';

export default function HomePage() {
  return (
    <div className="bg-background font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      <main className="min-h-screen w-full bg-background pt-20">
        <Hero />
        <SensoryStrip />
        <Services />
        <AddOns />
        <WhyUs />
        <Testimonials />
        <CtaBanner />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
