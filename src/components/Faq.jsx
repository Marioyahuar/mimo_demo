import Icon from './ui/Icon.jsx';
import { faq } from '../data/content.js';

export default function Faq() {
  return (
    <section id="faq" className="w-full pb-space-3xl">
      <div className="mx-auto max-w-[880px] px-space-md sm:px-margin-tablet">
        <div className="mb-space-xl text-center">
          <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">{faq.title}</h3>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{faq.lead}</p>
        </div>

        <div className="space-y-space-sm">
          {faq.items.map((item) => (
            <details
              key={item.question}
              className="group cursor-pointer rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between font-title-md text-title-md font-medium text-on-surface">
                <span>{item.question}</span>
                <Icon
                  name="expand_more"
                  className="text-on-surface-variant transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="mt-space-sm font-body-md text-body-md leading-relaxed text-on-surface-variant">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
