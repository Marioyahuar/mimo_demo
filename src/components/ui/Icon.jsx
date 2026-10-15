/**
 * Material Symbols icon.
 * `filled` toggles the FILL axis of the variable font.
 */
export default function Icon({ name, className = '', size = 20, filled = false }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: filled ? "'FILL' 1" : undefined,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
