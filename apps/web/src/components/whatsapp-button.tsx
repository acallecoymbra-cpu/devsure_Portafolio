const WHATSAPP_NUMBER = '59177044342';
const WHATSAPP_MESSAGE = '¡Hola! Me gustaría obtener más información sobre los servicios de DevSure.';

/** Fixed corner CTA (spec follow-up, §5.16): opens a WhatsApp chat with the company number in a new tab. */
export function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a className="whatsapp-button" href={href} target="_blank" rel="noreferrer" aria-label="Escribir por WhatsApp">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.15-.15.35-.4.52-.6.17-.2.22-.35.35-.58.13-.23.06-.43-.05-.6-.1-.16-.6-1.45-.83-1.98-.2-.5-.4-.43-.55-.44-.15-.01-.32-.01-.5-.01-.17 0-.45.06-.68.31-.23.25-.9.88-.9 2.13s.92 2.47 1.05 2.64c.13.17 1.8 2.75 4.37 3.74 2.57.98 2.57.65 3.03.62.47-.04 1.53-.63 1.74-1.23.22-.6.22-1.12.15-1.23-.06-.11-.24-.17-.53-.31Z" />
        <path d="M12.02 2C6.5 2 2 6.48 2 12c0 1.9.53 3.68 1.44 5.2L2 22l4.94-1.4A9.96 9.96 0 0 0 12.02 22C17.5 22 22 17.5 22 12S17.5 2 12.02 2Zm0 18.2c-1.7 0-3.28-.5-4.6-1.36l-.33-.2-2.9.82.83-2.85-.22-.34A8.16 8.16 0 0 1 3.8 12c0-4.53 3.7-8.2 8.22-8.2 4.5 0 8.18 3.68 8.18 8.2s-3.68 8.2-8.18 8.2Z" />
      </svg>
      <span>WhatsApp</span>
    </a>
  );
}
