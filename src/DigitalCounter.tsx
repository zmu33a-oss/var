import "./DigitalCounter.css";

type DigitalCounterProps = {
  value: number;
};

export default function DigitalCounter({ value }: DigitalCounterProps) {
  const digits = value.toString().split("");

  return (
    <div className="digital-counter">
      {digits.map((digit, index) => (
        <div key={index} className="digit-box">
          {digit}
        </div>
      ))}
    </div>
  );
}
