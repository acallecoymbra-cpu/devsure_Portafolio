'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const navigation = [
  { href: '/', label: 'Inicio' },
  { href: '/#trabajos-realizados', label: 'Trabajos realizados' },
  { href: '/#tecnologias', label: 'Tecnologías' },
  { href: '/#enfoque', label: 'Enfoque' },
  { href: '/cultura', label: 'CULTURA', emphasized: true },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (menuOpen) firstLinkRef.current?.focus();
  }, [menuOpen]);

  function closeMenu(returnFocus = false): void {
    setMenuOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" href="/" aria-label="DevSure, inicio">
          <span className="wordmark-mark" aria-hidden="true">
            DS
          </span>
          <span>DevSure</span>
        </Link>
        <button
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
          ref={buttonRef}
        >
          <span>Menú</span>
          <span className="menu-icon" aria-hidden="true" />
        </button>
        <nav
          id="primary-navigation"
          className="primary-navigation"
          aria-label="Navegación principal"
          data-open={menuOpen}
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeMenu(true);
          }}
        >
          <ul className="nav-list">
            {navigation.map((item, index) => {
              const isCurrentPage = item.href === '/cultura' && pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={item.emphasized ? 'nav-culture-link' : undefined}
                    aria-current={isCurrentPage ? 'page' : undefined}
                    onClick={() => closeMenu()}
                    ref={index === 0 ? firstLinkRef : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
