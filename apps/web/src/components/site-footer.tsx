import { getApiBaseUrl } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <p>Una base tranquila para construir productos digitales.</p>
        <p className="footer-meta">
          <span className="status-dot" aria-hidden="true" />
          API preparada · {getApiBaseUrl()}
        </p>
      </div>
    </footer>
  );
}
