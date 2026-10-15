import Container from './ui/Container.jsx';
import Button from './ui/Button.jsx';
import Icon from './ui/Icon.jsx';
import { hero } from '../data/content.js';

function FloatingBadge({ icon, title, subtitle }) {
  return (
    <div className="absolute -right-2 -top-4 flex items-center gap-space-xs rounded-2xl bg-surface/95 px-space-md py-space-xs shadow-[0_8px_24px_rgba(59,53,48,0.08)] backdrop-blur-md sm:-right-4 sm:top-6 sm:py-space-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
        <Icon name={icon} size={18} />
      </div>
      <div className="flex flex-col">
        <span className="font-label-md text-label-md font-semibold text-on-surface">{title}</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">{subtitle}</span>
      </div>
    </div>
  );
}

function FloatingCard({ icon, title, subtitle }) {
  return (
    <div className="absolute -bottom-6 left-4 flex max-w-[280px] items-center gap-space-sm rounded-2xl bg-surface-container-lowest px-space-lg py-space-sm shadow-[0_12px_32px_rgba(59,53,48,0.1)] sm:left-8">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
        <Icon name={icon} size={20} />
      </div>
      <div className="flex flex-col">
        <span className="font-title-md text-title-md font-semibold leading-tight text-on-surface">{title}</span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">{subtitle}</span>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden pb-space-3xl pt-space-xl lg:pb-space-4xl">
      <div className="pointer-events-none absolute left-1/2 top-12 -z-10 h-[450px] w-[700px] -translate-x-1/2 rounded-full bg-primary-container/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-100px] top-48 -z-10 h-[400px] w-[400px] rounded-full bg-secondary-container/25 blur-3xl" />

      <Container>
        <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12 lg:gap-space-2xl">
          {/* Text column */}
          <div className="flex flex-col items-start gap-space-md lg:col-span-6 lg:gap-space-lg">
            <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container px-space-md py-space-2xs shadow-sm">
              <div className="flex items-center text-primary-container">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" size={18} filled />
                ))}
              </div>
              <span className="font-label-md text-label-md font-medium text-on-surface">{hero.rating}</span>
            </div>

            <h1 className="font-display-lg text-display-lg-mobile font-semibold leading-tight tracking-tight text-on-surface sm:text-display-lg">
              {hero.titleLead} <span className="italic font-normal text-primary">{hero.titleHighlight}</span>{' '}
              {hero.titleTail}
            </h1>

            <p className="max-w-xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
              {hero.subtitle}
            </p>

            <div className="flex w-full flex-wrap items-center gap-space-sm pt-space-xs sm:w-auto sm:gap-space-md">
              <Button href="/reservar" icon="pets" className="w-full sm:w-auto">
                Reservar cita
              </Button>
              <Button
                href="#servicios"
                variant="soft"
                icon="arrow_downward"
                iconPosition="right"
                iconSize={18}
                className="w-full px-space-lg sm:w-auto"
              >
                Ver servicios
              </Button>
            </div>

            <div className="grid w-full grid-cols-3 gap-space-sm pt-space-md">
              {hero.highlights.map((item) => (
                <div key={item.label} className="flex flex-col">
                  <span className={`font-title-lg text-title-lg font-bold ${item.tone}`}>{item.value}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image column */}
          <div className="relative mt-space-md lg:col-span-6 lg:mt-0">
            <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-surface-container-low shadow-[0_16px_40px_-6px_rgba(59,53,48,0.12)]">
              <img
                src={hero.image}
                alt={hero.imageAlt}
                className="aspect-[1.34] w-full rounded-[2.5rem] object-cover transition-transform duration-500 ease-out hover:scale-[1.02]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>
            <FloatingBadge {...hero.badgeTop} />
            <FloatingCard {...hero.badgeBottom} />
          </div>
        </div>
      </Container>
    </section>
  );
}
