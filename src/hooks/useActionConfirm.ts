import { useEffect, useState } from 'react';

export function useActionConfirm(confirmWindowSeconds = 4) {
  const [confirmSeconds, setConfirmSeconds] = useState(0);

  useEffect(() => {
    if (confirmSeconds <= 0) return;

    const timeoutId = window.setTimeout(() => {
      setConfirmSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [confirmSeconds]);

  const isConfirming = confirmSeconds > 0;

  function requestConfirmation(onConfirm: () => void) {
    if (isConfirming) {
      onConfirm();
      setConfirmSeconds(0);
      return;
    }

    setConfirmSeconds(confirmWindowSeconds);
  }

  function cancelConfirmation() {
    setConfirmSeconds(0);
  }

  return {
    confirmSeconds,
    isConfirming,
    requestConfirmation,
    cancelConfirmation,
  };
}
