// Vibration is best-effort. Safari/iOS and most desktop hardware do not support it.
let lastPulse = 0;
export function haptic(duration = 10) {
  if (
    typeof navigator === "undefined" ||
    !("vibrate" in navigator) ||
    document.hidden
  )
    return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive)
    return;
  const now = performance.now();
  if (now - lastPulse < 120) return;
  lastPulse = now;
  navigator.vibrate(duration);
}
