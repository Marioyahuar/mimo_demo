import Container from './ui/Container.jsx';
import Icon from './ui/Icon.jsx';
import { brand, footer } from '../data/content.js';

export default function Footer() {
  return (
    <footer className="mt-space-4xl w-full bg-surface-container-low">
      <Container className="pb-space-2xl pt-space-3xl">
        <div className="grid grid-cols-1 gap-space-xl pb-space-2xl md:grid-cols-12 lg:gap-space-2xl">
          <div className="flex flex-col items-start gap-space-md md:col-span-5">
            <div className="flex items-center gap-space-sm">
              <img src={brand.logo} alt={`Logo ${brand.fullName}`} className="h-8 w-auto object-contain" />
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {brand.fullName}
              </span>
            </div>
            <p className="max-w-md font-body-md text-body-md leading-relaxed text-on-surface-variant">
              {footer.tagline}
            </p>
            <div className="flex items-center gap-space-sm pt-space-xs">
              {footer.socials.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-[0_2px_6px_-1px_rgba(59,53,48,0.06)] transition-all duration-200 hover:bg-secondary hover:text-on-secondary"
                >
                  <Icon name={social.icon} size={20} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-space-lg sm:grid-cols-3 md:col-span-7">
            {footer.columns.map((column) => (
              <div key={column.title} className="flex flex-col gap-space-sm">
                <span className="font-title-md text-title-md text-on-surface">{column.title}</span>
                {column.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-space-sm rounded-xl bg-surface-container/50 px-space-md py-space-sm text-center sm:flex-row sm:text-left">
          <p className="font-body-sm text-body-sm text-on-surface-variant">{footer.legal}</p>
          <span className="flex items-center gap-space-2xs font-label-sm text-label-sm font-semibold text-secondary">
            <Icon name="spa" size={16} /> Espacio 100% libre de estrés
          </span>
        </div>
      </Container>
    </footer>
  );
}
