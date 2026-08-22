/**
 * Persistent background music: looping audio with a spinning vinyl-style
 * toggle pinned to the bottom-left corner.
 *
 * Autoplay strategy: browsers block audible autoplay, but MUTED playback is
 * allowed — so the track starts immediately muted and the sound is restored
 * on the first pointer interaction anywhere. If the guest pauses explicitly,
 * nothing re-plays on its own.
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

  const attemptPlay = () => {
    audio
      .play()
      .then(sync)
      .catch(() => {
        /* still blocked; the button remains available */
      });
  };

  // Start right away, muted if necessary (muted autoplay is allowed).
  audio.muted = true;
  attemptPlay();

  // First interaction anywhere restores the sound.
  document.addEventListener(
    "pointerdown",
    () => {
      if (userPaused) return;
      audio.muted = false;
      if (audio.paused) attemptPlay();
    },
    { once: true, passive: true },
  );

  toggle.addEventListener("click", () => {
    if (audio.paused || audio.muted) {
      userPaused = false;
      audio.muted = false;
      attemptPlay();
    } else {
      userPaused = true;
      audio.pause();
      sync();
    }
  });

  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);
}
