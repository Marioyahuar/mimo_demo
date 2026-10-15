import Container from './ui/Container.jsx';
import Icon from './ui/Icon.jsx';
import Pill from './ui/Pill.jsx';
import { whyUs } from '../data/content.js';

export default function WhyUs() {
  return (
    <section id="nosotros" className="w-full py-space-3xl lg:py-space-4xl">
      <Container>
        <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12 lg:gap-space-3xl">
          {/* Content */}
          <div className="flex flex-col items-start gap-space-md lg:col-span-6">
            <Pill className="bg-secondary-fixed text-on-secondary-container">{whyUs.eyebrow}</Pill>
            <h2 className="font-headline-lg text-headline-lg-mobile font-semibold tracking-tight text-on-surface sm:text-headline-lg">
              {whyUs.title}
            </h2>
            <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{whyUs.lead}</p>

            <div className="flex flex-col gap-space-lg pt-space-sm">
              {whyUs.points.map((point) => (
                <div key={point.title} className="flex items-start gap-space-md">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
                    <Icon name="check" size={20} filled />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-title-lg text-title-lg font-semibold text-on-surface">{point.title}</h4>
                    <p className="mt-1 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image + stat */}
          <div className="relative lg:col-span-6">
            <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-surface-container-low shadow-[0_16px_40px_-6px_rgba(59,53,48,0.12)]">
              <img
                src={whyUs.image}
                alt={whyUs.imageAlt}
                className="aspect-[1.34] w-full rounded-[2.5rem] object-cover transition-transform duration-500 ease-out hover:scale-[1.02]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-on-surface/30 via-transparent to-transparent" />
            </div>

            <div className="absolute -bottom-6 right-2 flex items-center gap-space-md rounded-2xl bg-surface-container-lowest/95 px-space-lg py-space-md shadow-[0_12px_32px_rgba(59,53,48,0.12)] backdrop-blur-md sm:bottom-6 sm:right-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm">
                <Icon name="favorite" size={24} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="font-title-lg text-title-lg font-bold text-on-surface">{whyUs.stat.value}</span>
                  <span className="font-label-md text-label-md font-semibold text-secondary">
                    {whyUs.stat.label}
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{whyUs.stat.note}</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
