import { PiSealCheckFill } from "react-icons/pi";
import type { VerificationBadgeVariant } from "../lib/adminApi";
import { getVerificationBadgeA11yLabel } from "../lib/verificationBadges";
import styles from "./VerificationBadge.module.css";

type VerificationBadgeProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  variant?: VerificationBadgeVariant;
};

export default function VerificationBadge({
  size = "sm",
  label,
  className = "",
  variant = "yellow",
}: VerificationBadgeProps) {
  const resolvedLabel = label || getVerificationBadgeA11yLabel(variant);

  return (
    <span
      className={[
        styles.badge,
        styles[`variant-${variant}`],
        styles[`size-${size}`],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={resolvedLabel}
      aria-label={resolvedLabel}
    >
      <PiSealCheckFill className={styles.icon} />
    </span>
  );
}
