export function BoothHeader({ stage }: { stage: "capture" | "review" | "create" }) {
  return <header className="booth-header">
    <div className="wordmark">OUR LITTLE BOOTH<span aria-hidden="true">♥</span></div>
    <ol className="stage-progress" aria-label="Session progress">{["capture", "review", "create"].map((item, index) =>
      <li key={item} aria-current={item === stage ? "step" : undefined}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>,
    )}</ol><span className="header-note">JUST US, ONE FRAME AT A TIME.</span>
  </header>;
}
