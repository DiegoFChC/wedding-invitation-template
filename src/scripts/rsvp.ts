/**
 * RSVP form behavior: attendance toggle, attendee stepper, validation and
 * submission handling.
 *
 * Personalized invitations cap the stepper at the guest's allowedSlots
 * (read from data-min / data-max on [data-rsvp-stepper]) and skip the name
 * input (the guest name arrives pre-filled).
 *
 * For now the validated payload is logged to the console; the Google Sheets
 * (Apps Script) submission will be wired in a follow-up task.
 */

const FALLBACK_MIN = 1;
const FALLBACK_MAX = 10;

export function initRsvp(): void {
  const form = document.querySelector<HTMLFormElement>("[data-rsvp-form]");
  if (!form) return;

  const root = form.parentElement;
  if (!root) return;

  const nameInput = root.querySelector<HTMLInputElement>("[data-rsvp-name]");
  const guestInput = root.querySelector<HTMLInputElement>("input[name='name'][type='hidden']");
  const messageInput = root.querySelector<HTMLTextAreaElement>("[data-rsvp-message]");
  const attendanceGroup = root.querySelector<HTMLElement>("[data-rsvp-attendance]");
  const stepper = root.querySelector<HTMLElement>("[data-rsvp-stepper]");
  const countLabel = root.querySelector<HTMLElement>("[data-rsvp-count]");
  const minusBtn = root.querySelector<HTMLButtonElement>("[data-rsvp-minus]");
  const plusBtn = root.querySelector<HTMLButtonElement>("[data-rsvp-plus]");
  const submitBtn = root.querySelector<HTMLButtonElement>("[data-rsvp-submit]");
  const feedback = root.querySelector<HTMLElement>("[data-rsvp-feedback]");
  const successPanel = root.querySelector<HTMLElement>("[data-rsvp-success]");
  const successText = root.querySelector<HTMLElement>("[data-success-text]");
  const registeredPanel = root.querySelector<HTMLElement>("[data-rsvp-registered]");
  const registeredSummary = root.querySelector<HTMLElement>("[data-registered-summary]");

  if (
    !attendanceGroup ||
    !stepper ||
    !countLabel ||
    !minusBtn ||
    !plusBtn ||
    !submitBtn ||
    !feedback ||
    !successPanel ||
    !successText ||
    !registeredPanel ||
    !registeredSummary
  ) {
    return;
  }

  /* Previous response (localStorage) --------------------------------------- */
  const token = form.dataset.token ?? "";
  const storageKey = token ? `rsvp_confirmado_${token}` : "";

  interface SavedRsvp {
    name: string;
    attends: boolean;
    attendees: number;
  }

  const firstNameOf = (full: string) => full.split(/\s+/)[0];

  /** Elegant info card replacing the form when the guest already answered. */
  const showRegisteredCard = (saved: SavedRsvp) => {
    form.hidden = true;
    registeredSummary.textContent = saved.attends
      ? `${firstNameOf(saved.name)}: confirmaste ${saved.attendees} ${
          saved.attendees === 1 ? "asistente" : "asistentes"
        } para el gran día.`
      : `${firstNameOf(saved.name)}: nos indicaste que no podrás asistir.`;
    registeredPanel.hidden = false;
  };

  if (storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        showRegisteredCard(JSON.parse(raw as string) as SavedRsvp);
        return; // already answered: skip all form wiring
      }
    } catch {
      // Corrupted entry: treat as unanswered and continue
    }
  }

  /* Stepper bounds come from the invitation data -------------------------- */
  const MIN = Math.max(1, Number(stepper.dataset.min) || FALLBACK_MIN);
  const MAX = Math.max(MIN, Number(stepper.dataset.max) || FALLBACK_MAX);
  let attendees = Math.min(Math.max(Number(countLabel.textContent) || MIN, MIN), MAX);

  /* Attendance: starts neutral — the guest must choose explicitly ---------- */
  let attends: boolean | null = null;

  attendanceGroup.querySelectorAll<HTMLButtonElement>(".segmented__option").forEach((option) => {
    option.addEventListener("click", () => {
      attends = option.dataset.attendance === "yes";
      attendanceGroup.classList.remove("is-invalid");
      attendanceGroup
        .querySelectorAll(".segmented__option")
        .forEach((o) => o.classList.toggle("is-active", o === option));

      // Not attending: attendee count no longer applies
      stepper.classList.toggle("is-muted", attends === false);
    });
  });

  /* Attendees stepper ------------------------------------------------------ */
  const renderCount = () => {
    countLabel.textContent = String(attendees);
    minusBtn.disabled = attendees <= MIN;
    plusBtn.disabled = attendees >= MAX;
  };

  minusBtn.addEventListener("click", () => {
    attendees = Math.max(MIN, attendees - 1);
    renderCount();
  });

  plusBtn.addEventListener("click", () => {
    attendees = Math.min(MAX, attendees + 1);
    renderCount();
  });

  renderCount();

  /* Helpers ------------------------------------------------------------------ */
  const showFeedback = (message: string) => {
    feedback.textContent = message;
    feedback.hidden = false;
  };

  const clearFeedback = () => {
    feedback.textContent = "";
    feedback.hidden = true;
    nameInput?.classList.remove("is-invalid");
    attendanceGroup.classList.remove("is-invalid");
  };

  const setLoading = (loading: boolean) => {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? "Enviando..." : "Enviar confirmación";
  };

  const firstName = (full: string) => full.split(/\s+/)[0];

  /** Resolved name: hidden field on personalized invites, visible input otherwise. */
  const resolveName = (): string => (guestInput ? guestInput.value.trim() : (nameInput?.value.trim() ?? ""));

  const logPayload = (payload: Record<string, string | number>) => {
    // Next task: replace this with the Google Apps Script POST.
    console.log(
      "%c[RSVP] Confirmación validada",
      "color:#c9a227;font-weight:bold;",
      "\n" +
        JSON.stringify(payload, null, 2),
    );
  };

  const showSuccess = (name: string) => {
    form.hidden = true;
    successText.textContent =
      attends === false
        ? `Lamentamos que no puedas acompañarnos, ${firstName(name)}. Gracias por avisarnos.`
        : attendees > 1
          ? `Gracias, ${firstName(name)}. Registramos ${attendees} asistentes; te esperamos el 1 de Noviembre de 2026.`
          : `Gracias, ${firstName(name)}. Registramos tu asistencia para el 1 de Noviembre de 2026.`;
    successPanel.hidden = false;
  };

  /* Submission ----------------------------------------------------------------- */
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFeedback();

    /* Validation ------------------------------------------------------------- */
    const errors: string[] = [];

    const name = resolveName();
    if (!guestInput && name.length < 3) {
      nameInput?.classList.add("is-invalid");
      nameInput?.focus();
      errors.push("escribe tu nombre y apellido");
    }

    if (attends === null) {
      attendanceGroup.classList.add("is-invalid");
      errors.push("selecciona si podrás asistir o no");
    }

    // Attending requires an explicit attendee count within the allowed slots.
    const countValid = attends !== null && attendees >= MIN && attendees <= MAX;
    if (attends === true && !countValid) {
      errors.push(`indica cuántos asistentes serán (entre ${MIN} y ${MAX})`);
    }

    if (errors.length > 0) {
      const prefix = errors.length > 1 ? "Para continuar: " : "Para continuar, ";
      showFeedback(prefix + errors.join(", ") + ".");
      return;
    }

    /* Validated payload ------------------------------------------------------- */
    const payload = {
      token: form.dataset.token ?? "",
      name,
      attends: attends === true,
      attendees: attends === true ? attendees : 0,
      message: messageInput?.value.trim() ?? "",
    };

    logPayload(payload);

    // Remember the answer so revisits show the registered card instead.
    if (storageKey) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ ...payload, savedAt: new Date().toISOString() }),
        );
      } catch {
        // Storage unavailable (private mode): proceed without persistence
      }
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSuccess(name);
    }, 600); // brief beat so the button state is perceivable
  });
}
