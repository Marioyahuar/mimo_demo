import Container from './ui/Container.jsx';
import { testimonials } from '../data/content.js';

export default function Testimonials() {
  return (
    <section className="w-full bg-surface-container-low/40 py-space-2xl">
      <Container>
        <div className="mx-auto mb-space-xl max-w-xl text-center">
          <span className="font-label-md text-label-md font-semibold uppercase tracking-wider text-secondary">
            {testimonials.eyebrow}
          </span>
          <h3 className="mt-1 font-headline-md text-headline-md font-semibold text-on-surface">
            {testimonials.title}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          {testimonials.items.map((item) => (
            <figure
              key={item.name}
              className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm"
            >
              <blockquote className="mb-space-md font-body-md text-body-md italic text-on-surface-variant">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-space-sm">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${item.avatar}`}
                >
                  {item.initials}
                </div>
                <div>
                  <p className="font-title-md text-title-md leading-snug text-on-surface">{item.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{item.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
