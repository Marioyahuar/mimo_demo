import Pill from './Pill.jsx';

/**
 * Reusable centered section heading: eyebrow pill + title + optional lead text.
 */
export default function SectionHeading({ eyebrow, eyebrowClassName = '', title, lead, className = '' }) {
  return (
    <div className={`mx-auto flex max-w-2xl flex-col items-center gap-space-xs text-center ${className}`}>
      {eyebrow && (
        <Pill className={eyebrowClassName || 'bg-secondary-fixed text-on-secondary-container'}>
          {eyebrow}
        </Pill>
      )}
      <h2 className="mt-space-2xs font-headline-lg text-headline-lg-mobile font-semibold tracking-tight text-on-surface sm:text-headline-lg">
        {title}
      </h2>
      {lead && <p className="font-body-lg text-body-lg text-on-surface-variant">{lead}</p>}
    </div>
  );
}
