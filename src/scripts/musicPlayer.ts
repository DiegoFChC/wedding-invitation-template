/**
 * Persistent background music: looping audio with a spinning vinyl-style
 * toggle pinned to the bottom-left corner.
 *
 * Playback starts ONLY when the guest taps the wax seal ([data-seal]).
 * Because that tap is a genuine user gesture, `audio.play()` with sound is
 * allowed on every device/browser (no muted-autoplay tricks needed).
 */

export function initMusicPlayer(): void {
  const root = document.querySelector<HTMLElement>("[data-music]");
  const audio = root?.querySelector<HTMLAudioElement>("[data-music-audio]");
  const toggle = root?.querySelector<HTMLButtonElement>("[data-music-toggle]");
  if (!root || !audio || !toggle) return;

  let userPaused = false;

  const sync = () => {
    const playing = !audio.paused;
    root.classList.toggle("is-playing", playing);
    toggle.setAttribute("aria-pressed", String(playing));
  };

  const start = () => {
    if (userPaused || !audio.paused) return;
    audio
      .play()
      .then(sync)
      .catch(() => {
        /* extremely rare; the toggle button remains available */
      });
  };

  // The seal tap doubles as the "play" trigger.
  const seal = document.querySelector<HTMLButtonElement>("[data-seal]");
  seal?.addEventListener("click", start);

  toggle.addEventListener("click", () => {
    if (audio.paused) {
      userPaused = false;
      start();
    } else {
      userPaused = true;
      audio.pause();
      sync();
    }
  });

  // Some mobile browsers suspend media in the background: resume on return.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !userPaused && audio.paused) start();
  });

  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);
}
