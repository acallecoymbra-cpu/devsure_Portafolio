import Link from "next/link";

const navigation = [
  { href: "#principios", label: "Principios" },
  { href: "#ruta", label: "Ruta" },
  { href: "#estado", label: "Estado" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" href="/" aria-label="DevSure, inicio">
          <span className="wordmark-mark" aria-hidden="true">
            DS
          </span>
          <span>DevSure</span>
        </Link>
        <nav aria-label="Navegación principal">
          <ul className="nav-list">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
