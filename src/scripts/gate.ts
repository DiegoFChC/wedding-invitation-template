/**
 * Guest-code gate: validates the input and forwards to the invitation.
 * Unknown codes land on the friendly 404 page.
 */
export function initGate(): void {
  const form = document.querySelector<HTMLFormElement>("[data-gate-form]");
  const input = document.querySelector<HTMLInputElement>("[data-gate-code]");
  const feedback = document.querySelector<HTMLElement>("[data-gate-feedback]");
  if (!form || !input || !feedback) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const code = input.value.trim();
    if (!code) {
      input.classList.add("is-invalid");
      input.focus();
      feedback.textContent = "Escribe tu código de invitado para continuar.";
      feedback.hidden = false;
      return;
    }

    location.assign(`/invitacion/${encodeURIComponent(code)}`);
  });

  input.addEventListener("input", () => {
    input.classList.remove("is-invalid");
    feedback.hidden = true;
  });
}
