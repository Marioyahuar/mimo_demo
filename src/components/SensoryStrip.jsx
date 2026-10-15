import Container from './ui/Container.jsx';
import Icon from './ui/Icon.jsx';
import { sensory } from '../data/content.js';

export default function SensoryStrip() {
  return (
    <section className="w-full bg-surface-container-low/60 py-space-lg">
      <Container>
        <div className="grid grid-cols-2 items-center gap-space-md text-center md:grid-cols-4">
          {sensory.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center justify-center gap-space-2xs p-space-xs"
            >
              <Icon name={item.icon} size={26} className={item.tone} />
              <span className="font-title-md text-title-md font-medium text-on-surface">{item.title}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{item.subtitle}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
