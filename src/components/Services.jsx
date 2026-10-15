import Container from './ui/Container.jsx';
import Icon from './ui/Icon.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import { services } from '../data/content.js';

function ServiceCard({ item }) {
  const cardBase =
    'group relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-surface-container-lowest p-space-xl transition-all duration-300 hover:-translate-y-1.5';
  const cardTone = item.featured
    ? 'shadow-[0_8px_28px_-2px_rgba(59,53,48,0.08)] hover:shadow-[0_16px_36px_-4px_rgba(59,53,48,0.12)] ring-1 ring-primary-container/30'
    : 'shadow-[0_4px_20px_-2px_rgba(59,53,48,0.05)] hover:shadow-[0_12px_32px_-4px_rgba(59,53,48,0.09)]';

  const ctaTone = item.featured
    ? 'bg-primary-container text-on-primary shadow-sm group-hover:bg-primary'
    : 'bg-surface-container text-on-surface group-hover:bg-primary-container group-hover:text-on-primary';

  return (
    <div className={`${cardBase} ${cardTone}`}>
      {item.badge && (
        <div className="absolute right-5 top-4 rounded-full bg-primary-container px-space-sm py-0.5 font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-primary">
          {item.badge}
        </div>
      )}

      <div className="w-full">
        <div
          className={`mb-space-lg flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconWrap}`}
        >
          <Icon name={item.icon} size={28} />
        </div>
        <h3 className="mb-space-xs font-headline-sm text-headline-sm font-semibold text-on-surface">
          {item.title}
        </h3>
        <p className="mb-space-lg font-body-md text-body-md leading-relaxed text-on-surface-variant">
          {item.description}
        </p>
      </div>

      <div className="w-full">
        <div className="mb-space-lg flex flex-wrap gap-space-2xs">
          {item.tags.map((tag) => (
            <span
              key={tag.label}
              className={`rounded-full px-space-sm py-1 font-label-md text-label-md ${tag.className}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
        <a
          href="/reservar"
          className={`inline-flex w-full items-center justify-between rounded-xl px-space-md py-space-sm font-label-lg text-label-lg transition-colors duration-200 ${ctaTone}`}
        >
          <span>Seleccionar ritual</span>
          <Icon name="chevron_right" size={18} />
        </a>
      </div>
    </div>
  );
}

export default function Services() {
  return (
    <section id="servicios" className="w-full py-space-3xl lg:py-space-4xl">
      <Container>
        <SectionHeading
          className="mb-space-2xl"
          eyebrow={services.eyebrow}
          title={services.title}
          lead={services.lead}
        />
        <div className="grid grid-cols-1 items-stretch gap-space-lg md:grid-cols-3 lg:gap-space-xl">
          {services.items.map((item) => (
            <ServiceCard key={item.title} item={item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
