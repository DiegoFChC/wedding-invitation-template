/**
 * Persistent background music: looping audio with a spinning vinyl-style
 * toggle pinned to the bottom-left corner.
 *
 * Autoplay strategy (mobile browsers are strict):
 *   1. Immediate MUTED attempt — allowed on most desktops.
 *   2. Every early interaction (tap/touch/click anywhere, e.g. the wax-seal)
 *      retries with sound until playback actually starts. Mobile browsers
 *      reject even muted autoplay under battery/data savers, and with
 *      preload="auto" still needing to buffer, retrying per gesture is what
 *      finally gets the song going.
 * If the guest pauses explicitly, nothing re-plays on its own.
 */

export function initMusicPlayer(): void {
  const root = document.querySelector<HTMLElement>("[data-music]");
  const audio = root?.querySelector<HTMLAudioElement>("[data-music-audio]");
  const toggle = root?.querySelector<HTMLButtonElement>("[data-music-toggle]");
  if (!root || !audio || !toggle) return;

  let userPaused = false;
  let soundOn = false;

  const sync = () => {
    const playing = !audio.paused;
    root.classList.toggle("is-playing", playing);
    toggle.setAttribute("aria-pressed", String(playing));
  };

  const start = () => {
    if (userPaused || !audio.paused) return;
    audio
      .play()
      .then(() => {
        soundOn = true;
        sync();
      })
      .catch(() => {
        /* retried on the next gesture */
      });
  };

  // 1) Immediate muted attempt (desktops mostly).
  audio.muted = true;
  start();

  // 2) Retry with sound on every early gesture until it sticks (phones).
  const kickstart = () => {
    if (soundOn || userPaused) return;
    soundOn = true;
    audio.muted = false;
    start();
  };
  ["pointerdown", "touchstart", "click"].forEach((event) =>
    document.addEventListener(event, kickstart, { passive: true }),
  );

  // Some mobile browsers suspend media in the background: resume on return.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && soundOn && !userPaused && audio.paused) start();
  });

  toggle.addEventListener("click", () => {
    if (audio.paused || audio.muted) {
      userPaused = false;
      soundOn = true;
      audio.muted = false;
      start();
    } else {
      userPaused = true;
      audio.pause();
      sync();
    }
  });

  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);
}
