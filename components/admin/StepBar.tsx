const STEPS = ['Invoice sent', 'Paid', 'Booked', 'Confirmed', 'Shot', 'Gallery', 'Delivered'];

export default function StepBar({ index, compact = false }: { index: number; compact?: boolean }) {
  return (
    <ol className={compact ? 'a-steps compact' : 'a-steps'} aria-label={`Step ${index + 1} of ${STEPS.length}`}>
      {STEPS.map((s, i) => (
        <li key={s} className={i < index ? 'done' : i === index ? 'now' : ''} aria-current={i === index ? 'step' : undefined}>
          <span className="bar" />
          {!compact && <span className="lbl">{s}</span>}
        </li>
      ))}
    </ol>
  );
}
