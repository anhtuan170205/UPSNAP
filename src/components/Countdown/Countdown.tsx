import "./Countdown.css";

interface CountdownProps {
  value: number;
}

export function Countdown({ value }: CountdownProps) {
  return (
    <div className="countdown">
      {value}
    </div>
  );
}