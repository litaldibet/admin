import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

let openModalCount = 0;

type AppModalProps = {
  children: ReactNode;
};

function applyAppLock() {
  document.body.classList.add("app-has-modal");

  const appContainer = document.querySelector(".app-container");
  if (appContainer) {
    appContainer.setAttribute("inert", "");
    appContainer.setAttribute("aria-hidden", "true");
  }
}

function removeAppLock() {
  document.body.classList.remove("app-has-modal");

  const appContainer = document.querySelector(".app-container");
  if (appContainer) {
    appContainer.removeAttribute("inert");
    appContainer.removeAttribute("aria-hidden");
  }
}

export default function AppModal({ children }: AppModalProps) {
  useEffect(() => {
    openModalCount += 1;

    if (openModalCount === 1) {
      applyAppLock();
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    return () => {
      openModalCount = Math.max(0, openModalCount - 1);

      if (openModalCount === 0) {
        removeAppLock();
      }
    };
  }, []);

  const root = document.getElementById("app-modal-root") ?? document.body;

  return createPortal(
    <div className="app-modal-backdrop">
      {children}
    </div>,
    root
  );
}
