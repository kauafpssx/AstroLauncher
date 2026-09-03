/** Decorative dotted background behind the instances grid: purely visual,
 * no pointer interaction, sits below all grid content. */
export function InstancesBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    />
  )
}
