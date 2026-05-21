import { useEffect, useState } from "react";
import { MATCH_KICKOFF_COUNTDOWN_SECONDS } from "../leagues.constants";
import { formatCountdown } from "../leagues.utils";

export function useCountdown() {
  const [kickoffCountdownSeconds, setKickoffCountdownSeconds] = useState(
    MATCH_KICKOFF_COUNTDOWN_SECONDS,
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setKickoffCountdownSeconds((currentSeconds) =>
        currentSeconds > 0 ? currentSeconds - 1 : 0,
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const kickoffCountdownLabel = formatCountdown(kickoffCountdownSeconds);
  const kickoffAt = new Date(Date.now() + kickoffCountdownSeconds * 1000);

  return { kickoffCountdownSeconds, kickoffCountdownLabel, kickoffAt };
}
