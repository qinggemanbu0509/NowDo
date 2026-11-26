import { useEffect } from "react";
import { useLanguage } from "./interface-language.tsx";

export const nowDoLogo = "/logo.png?v=nowdo";
const launchKey = "nowdo.launch-shown";

export function shouldShowLaunch(): boolean {
  try {
    return sessionStorage.getItem(launchKey) !== "1";
  } catch {
    return true;
  }
}

export function rememberLaunch(): void {
  try {
    sessionStorage.setItem(launchKey, "1");
  } catch {
    // The opening screen can still be dismissed when storage is unavailable.
  }
}

export function LaunchScreen({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useLanguage();
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onDismiss, reducedMotion ? 950 : 1650);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <section className="launch-screen" aria-label={t("opening")}>
      <button className="launch-skip" type="button" onClick={onDismiss}>
        {t("skip")}
      </button>
      <div className="launch-content">
        <span className="launch-mark">
          <img src={nowDoLogo} alt="" width={104} height={104} />
        </span>
        <p className="launch-brand">
          Tokenow·Now<span>Do</span>
        </p>
        <div className="launch-tagline">
          <p lang="en">From to-do to done.</p>
          <p lang="zh-CN">从待办，到办成。</p>
        </div>
      </div>
    </section>
  );
}
