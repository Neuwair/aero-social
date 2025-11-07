export function initAlertPopUp() {
  try {
    if (typeof window === "undefined") return;

    const popup = document.getElementById("aero-alert-popup");
    if (!popup) return;

    const windowEl = popup.querySelector(".aero-alert-window");
    const timerBar = popup.querySelector(".aero-alert-timer-bar");

    popup.setAttribute("aria-hidden", "false");
    popup.classList.add("visible");
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const previouslyFocused = document.activeElement;
    const focusableSelector =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
    let focusable = [];
    try {
      focusable = Array.from(windowEl.querySelectorAll(focusableSelector));
    } catch (e) {
      focusable = [];
    }

    if (windowEl && !windowEl.hasAttribute("tabindex"))
      windowEl.setAttribute("tabindex", "0");
    windowEl.focus();

    function handleKey(e) {
      if (e.key === "Tab") {
        if (focusable.length === 0) {
          e.preventDefault();
          windowEl.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            document.activeElement === windowEl
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
      }
    }

    function handleFocusIn(e) {
      if (!popup.contains(e.target)) {
        e.stopPropagation();
        windowEl.focus();
      }
    }

    document.addEventListener("keydown", handleKey, true);
    document.addEventListener("focusin", handleFocusIn, true);

    const SHOW_MS = 5000;
    const start = performance.now();
    let rafId = null;

    function tick(now) {
      const elapsed = now - start;
      const pct = Math.min(1, elapsed / SHOW_MS);
      if (timerBar) timerBar.style.width = `${pct * 100}%`;
      if (elapsed < SHOW_MS) {
        rafId = requestAnimationFrame(tick);
      } else {
        done();
      }
    }

    function done() {
      if (rafId) cancelAnimationFrame(rafId);

      popup.classList.remove("visible");
      popup.classList.add("closing");

      if (timerBar) timerBar.style.width = `100%`;

      const EXIT_ANIM_MS = 360;
      setTimeout(() => {
        popup.classList.remove("closing");
        popup.setAttribute("aria-hidden", "true");
        document.body.style.overflow = originalOverflow || "";
        document.removeEventListener("keydown", handleKey, true);
        document.removeEventListener("focusin", handleFocusIn, true);
        try {
          if (
            previouslyFocused &&
            typeof previouslyFocused.focus === "function"
          )
            previouslyFocused.focus();
        } catch (e) {}
        if (popup && popup.parentNode) popup.parentNode.removeChild(popup);
      }, EXIT_ANIM_MS);
    }

    rafId = requestAnimationFrame(tick);
  } catch (err) {
    console.error("initAlertPopUp error:", err);
  }
}
