/**
 * Small rounded label used for section eyebrows and tags.
 */
export default function Pill({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-space-md py-space-2xs font-label-md text-label-md font-semibold uppercase tracking-wider ${className}`}
    >
      {children}
    </span>
  );
}
