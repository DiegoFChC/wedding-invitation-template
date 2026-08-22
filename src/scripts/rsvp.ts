/**
 * RSVP form behavior: attendance toggle, attendee stepper, validation and
 * submission to a Google Apps Script Web App (writes into Google Sheets).
 *
 * Personalized invitations cap the stepper at the guest's allowedSlots
 * (read from data-min / data-max on [data-rsvp-stepper]) and skip the name
 * input (the guest name arrives pre-filled).
 *
 * Google Sheets is the SINGLE SOURCE OF TRUTH for previous answers:
 * on load the script asks `GET APPS_SCRIPT_URL?token=<token>` (Apps Script
 * `doGet` scans the sheet's token column); there is NO local persistence.
 */

/** Google Apps Script Web App (/exec) backing the RSVP sheet. */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw-TrxRB7yVPWl5Yhznm0lHo6X00Xe-zWwuvus11R7R9CZV1h5dhgh-U-BWO_Ngwdin7A/exec";

const FALLBACK_MIN = 1;
const FALLBACK_MAX = 10;

/** Shape sent to Apps Script. */
interface RsvpPayload {
  token: string;
  name: string;
  attendance: "yes" | "no";
  count: number;
  message: string;
}

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
  const loadingStatus = root.querySelector<HTMLElement>("[data-rsvp-loading]");

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

  /* Identity ------------------------------------------------------------------ */
  const token = form.dataset.token ?? "";

  const firstNameOf = (full: string) => full.split(/\s+/)[0];

  /** Elegant info card replacing the form when the guest already answered. */
  const showRegisteredCard = (saved: RsvpPayload) => {
    setChecking(false); // terminate the server-lookup state on every path
    form.hidden = true;
    registeredSummary.textContent =
      saved.attendance === "yes"
        ? `${firstNameOf(saved.name)}: confirmaste ${saved.count} ${
            saved.count === 1 ? "asistente" : "asistentes"
          } para el gran día.`
        : `${firstNameOf(saved.name)}: nos indicaste que no podrás asistir.`;
    registeredPanel.hidden = false;
  };

  /** Subtle checking state while the server lookup runs. */
  const setChecking = (checking: boolean) => {
    if (loadingStatus) loadingStatus.hidden = !checking;
    form.classList.toggle("is-checking", checking);
    form.setAttribute("aria-busy", String(checking));
    submitBtn.disabled = checking;
  };

  /* Attendance: defaults to attending ------------------------------------- */
  let attends = true;

  /* Attendees stepper ------------------------------------------------------ */
  const MIN = Math.max(1, Number(stepper.dataset.min) || FALLBACK_MIN);
  const MAX = Math.max(MIN, Number(stepper.dataset.max) || FALLBACK_MAX);
  let attendees = Math.min(Math.max(Number(countLabel.textContent) || MIN, MIN), MAX);

  const renderCount = () => {
    countLabel.textContent = String(attendees);
    minusBtn.disabled = attendees <= MIN;
    plusBtn.disabled = attendees >= MAX;
  };

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

  /** Resolved name: hidden field on personalized invites, visible input otherwise. */
  const resolveName = (): string =>
    guestInput ? guestInput.value.trim() : (nameInput?.value.trim() ?? "");

  const firstName = (full: string) => full.split(/\s+/)[0];

  /** Debug trail; the sheet is the source of truth. */
  const logPayload = (payload: RsvpPayload) => {
    console.log(
      "%c[RSVP] Confirmación enviada",
      "color:#c9a227;font-weight:bold;",
      `\n${JSON.stringify(payload, null, 2)}`,
    );
  };

  const showSuccess = (name: string) => {
    form.hidden = true;
    successText.textContent =
      !attends
        ? `Lamentamos que no puedas acompañarnos, ${firstName(name)}. Gracias por avisarnos.`
        : attendees > 1
          ? `Gracias, ${firstName(name)}. Registramos ${attendees} asistentes; te esperamos el 1 de Noviembre de 2026.`
          : `Gracias, ${firstName(name)}. Registramos tu asistencia para el 1 de Noviembre de 2026.`;
    successPanel.hidden = false;
  };

  /** Wire all interactive behavior; only called when the form stays active. */
  const setupInteractive = (): void => {
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

    minusBtn.addEventListener("click", () => {
      attendees = Math.max(MIN, attendees - 1);
      renderCount();
    });

    plusBtn.addEventListener("click", () => {
      attendees = Math.min(MAX, attendees + 1);
      renderCount();
    });

    renderCount();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFeedback();

      /* Validation ----------------------------------------------------------- */
      const errors: string[] = [];

      const name = resolveName();
      if (!guestInput && name.length < 3) {
        nameInput?.classList.add("is-invalid");
        nameInput?.focus();
        errors.push("escribe tu nombre y apellido");
      }

      // Attending requires an attendee count within the allowed slots.
      if (attends && !(attendees >= MIN && attendees <= MAX)) {
        errors.push(`indica cuántos asistentes serán (entre ${MIN} y ${MAX})`);
      }

      if (errors.length > 0) {
        const prefix = errors.length > 1 ? "Para continuar: " : "Para continuar, ";
        showFeedback(prefix + errors.join(", ") + ".");
        return;
      }

      /* Payload ---------------------------------------------------------------- */
      const payload: RsvpPayload = {
        token,
        name,
        attendance: attends ? "yes" : "no",
        count: attends ? attendees : 0,
        message: messageInput?.value.trim() ?? "",
      };

      setLoading(true);

      try {
        // mode:"no-cors" makes the response opaque (unreadable), so reaching
        // here counts as delivered. The body goes as text/plain — with no-cors
        // the JSON content type would be blocked — and Apps Script parses it
        // from e.postData.contents.
        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });

        logPayload(payload);
        showSuccess(name);
      } catch {
        setLoading(false);
        showFeedback("No pudimos enviar tu confirmación. Revisa tu conexión e intenta de nuevo.");
      }
    });
  };

  /* Boot sequence ------------------------------------------------------------ */
  const boot = async (): Promise<void> => {
    // Generic view (no token): nothing to look up server-side.
    if (!token) {
      setupInteractive();
      return;
    }

    // Ask the sheet whether this token already answered.
    setChecking(true);
    try {
      const response = await fetch(
        `${APPS_SCRIPT_URL}?token=${encodeURIComponent(token)}`,
      );
      const result = (await response.json()) as {
        status?: string;
        alreadyAnswered?: boolean;
        data?: { name?: string; attendance?: string; count?: number };
      };

      if (result.status === "success" && result.alreadyAnswered) {
        const data = result.data ?? {};
        showRegisteredCard({
          token,
          name: String(data.name ?? ""),
          attendance: data.attendance === "yes" ? "yes" : "no",
          count: Number(data.count) || 0,
          message: "",
        });
        return; // answered elsewhere: keep the summary card up
      }
    } catch {
      // Network/CORS failure: don't block the guest — show the form.
    }
    setChecking(false);

    // First-time guest (or lookup failed): enable the form.
    setupInteractive();
  };

  void boot();
}
