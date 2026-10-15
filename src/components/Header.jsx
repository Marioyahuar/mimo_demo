import Container from './ui/Container.jsx';
import Icon from './ui/Icon.jsx';
import { brand, nav } from '../data/content.js';

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full bg-background/85 shadow-[0_4px_20px_-2px_rgba(59,53,48,0.05)] backdrop-blur-md transition-all duration-300">
      <Container className="flex h-20 items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm">
          <img src={brand.logo} alt={`Logo ${brand.fullName}`} className="h-8 w-auto object-contain" />
          <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">
            {brand.name}
          </span>
        </div>

        <nav className="hidden items-center gap-space-lg md:flex">
          {nav.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={index === 0 ? 'page' : undefined}
              className={
                index === 0
                  ? 'rounded-full bg-surface-container-high px-space-xs py-space-2xs font-title-md text-title-md text-on-surface transition-colors duration-200'
                  : 'rounded-full px-space-xs py-space-2xs font-title-md text-title-md text-on-surface-variant transition-colors duration-200 hover:text-on-surface'
              }
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-space-sm sm:gap-space-md">
          <a
            href="/reservar"
            className="inline-flex items-center justify-center rounded-full bg-primary-container px-space-lg py-space-sm font-label-lg text-label-lg text-on-primary shadow-[0_8px_24px_-2px_rgba(232,146,124,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:text-on-primary"
          >
            Reservar cita
          </a>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-[0_2px_6px_-1px_rgba(59,53,48,0.08)]">
            <Icon name="person" size={18} className="text-on-primary" />
          </div>
        </div>
      </Container>
    </header>
  );
}
