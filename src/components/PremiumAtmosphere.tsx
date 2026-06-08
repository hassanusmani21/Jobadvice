const fireflyCount = 14;

export default function PremiumAtmosphere() {
  return (
    <div aria-hidden="true" className="premium-atmosphere">
      <div className="premium-light-field premium-light-field-top" />
      <div className="premium-light-field premium-light-field-mid" />
      <div className="premium-noise" />
      <div className="premium-fireflies">
        {Array.from({ length: fireflyCount }, (_, index) => (
          <span
            // Static particles keep this deterministic for SSR while CSS handles the motion.
            key={index}
            className={`premium-firefly premium-firefly-${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
