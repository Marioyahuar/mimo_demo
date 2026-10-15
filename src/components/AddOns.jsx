import Container from './ui/Container.jsx';
import Icon from './ui/Icon.jsx';
import { addOns } from '../data/content.js';

export default function AddOns() {
  return (
    <section className="w-full bg-surface-container-low py-space-2xl">
      <Container>
        <div className="rounded-[28px] bg-surface-container-lowest p-space-lg shadow-sm sm:p-space-xl">
          <div className="flex flex-col justify-between gap-space-md border-b border-outline-variant/30 pb-space-lg md:flex-row md:items-center">
            <div>
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
                {addOns.eyebrow}
              </span>
              <h3 className="mt-1 font-headline-md text-headline-md font-semibold text-on-surface">
                {addOns.title}
              </h3>
            </div>
            <p className="max-w-sm font-body-sm text-body-sm text-on-surface-variant">{addOns.note}</p>
          </div>

          <div className="grid grid-cols-1 gap-space-md pt-space-lg sm:grid-cols-2 lg:grid-cols-4">
            {addOns.items.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-space-sm rounded-2xl bg-surface-container/50 p-space-md transition-colors hover:bg-surface-container-high"
              >
                <Icon name={item.icon} size={24} className="text-secondary" />
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md font-medium text-on-surface">{item.title}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{item.subtitle}</span>
                  <span className="mt-space-2xs font-label-md text-label-md font-semibold text-primary">
                    {item.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
