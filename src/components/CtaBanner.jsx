import Container from './ui/Container.jsx';
import Button from './ui/Button.jsx';
import Icon from './ui/Icon.jsx';
import { ctaBanner } from '../data/content.js';

export default function CtaBanner() {
  return (
    <section className="w-full py-space-3xl lg:py-space-4xl">
      <Container>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-primary-container p-space-xl shadow-[0_20px_50px_-8px_rgba(232,146,124,0.45)] sm:p-space-3xl">
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-white/15 blur-xl" />

          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="mb-space-md inline-flex items-center gap-space-2xs rounded-full bg-white/20 px-space-md py-1 font-label-md text-label-md uppercase tracking-wider text-white backdrop-blur-md">
              <Icon name="celebration" size={16} />
              <span>{ctaBanner.badge}</span>
            </div>

            <h2 className="mb-space-sm font-headline-lg text-headline-lg-mobile font-semibold leading-tight tracking-tight text-white sm:text-headline-lg">
              {ctaBanner.title}
            </h2>

            <p className="mb-space-xl max-w-xl font-body-lg text-body-lg leading-relaxed text-white/90">
              {ctaBanner.subtitle}
            </p>

            <Button href="/reservar" variant="light" icon="calendar_month" className="px-space-2xl py-space-md">
              {ctaBanner.button}
            </Button>

            <div className="mt-space-lg flex items-center gap-space-xs font-body-sm text-body-sm text-white/80">
              <Icon name="verified_user" size={18} />
              <span>{ctaBanner.reassurance}</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
