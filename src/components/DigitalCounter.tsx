import styles from "../pages-css/DigitalCounter.module.css";

type DigitalCounterProps = {
  value: number;
};

export default function DigitalCounter({ value }: DigitalCounterProps) {
  const digits = value.toString().split("");

  return (
    <div className={styles["digital-counter"]}>
      {digits.map((digit, index) => (
        <div key={`${digit}-${index}`} className={styles["digit-box"]}>
          {digit}
        </div>
      ))}
    </div>
  );
}
