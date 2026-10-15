/**
 * Centered page container with the responsive horizontal margins
 * used across every section of the landing.
 */
export default function Container({ children, className = '' }) {
  return (
    <div
      className={`mx-auto max-w-[1280px] px-space-md sm:px-margin-tablet lg:px-margin-desktop ${className}`}
    >
      {children}
    </div>
  );
}
