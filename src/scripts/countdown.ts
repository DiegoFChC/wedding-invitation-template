/**
 * Live countdown to the wedding date.
 * Renders into [data-countdown] cells and ticks every second.
 */

/** Wedding date: November 1st, 2026, local time. */
const TARGET = new Date(2026, 10, 1, 0, 0, 0);

const pad = (value: number) => String(value).padStart(2, "0");

export function initCountdown(): void {
  const days = document.querySelector<HTMLElement>("[data-countdown='days']");
  const hours = document.querySelector<HTMLElement>("[data-countdown='hours']");
  const minutes = document.querySelector<HTMLElement>("[data-countdown='minutes']");
  const seconds = document.querySelector<HTMLElement>("[data-countdown='seconds']");

  if (!days || !hours || !minutes || !seconds) return;

  const render = () => {
    const total = Math.max(0, Math.floor((TARGET.getTime() - Date.now()) / 1000));
    days.textContent = String(Math.floor(total / 86_400));
    hours.textContent = pad(Math.floor((total % 86_400) / 3_600));
    minutes.textContent = pad(Math.floor((total % 3_600) / 60));
    seconds.textContent = pad(total % 60);
  };

  render();
  setInterval(render, 1_000);
}
