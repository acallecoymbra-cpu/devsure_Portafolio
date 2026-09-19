import type { CulturePillarVisual } from '@devsure/contracts';
import type { CSSProperties, ReactElement } from 'react';
import styles from './culture-pillars.module.css';

/*
 * One abstract "blueprint" scene per pillar, all on the same 480×300 canvas
 * and drawn with the same three primitives so they read as one family:
 *   .draw  — a stroke that draws itself in when its pillar becomes active
 *            (`pathLength="1"` so the dash maths never depends on real length)
 *   .node  — a filled point that pops in after the strokes
 *   .glass — a soft translucent fill
 * `--i` staggers the entrance. Decorative only: the parent hides them from
 * assistive tech (the pillar's title + description carry the meaning).
 */

const at = (i: number) => ({ '--i': i }) as CSSProperties;

function Draw({ d, i, dashed }: { d: string; i: number; dashed?: boolean }) {
  return (
    <path
      d={d}
      pathLength={1}
      className={`${styles.draw} ${dashed ? styles.dashed : ''}`}
      style={at(i)}
    />
  );
}

function Node({ x, y, r, i, hollow }: { x: number; y: number; r: number; i: number; hollow?: boolean }) {
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      className={`${styles.node} ${hollow ? styles.nodeHollow : ''}`}
      style={at(i)}
    />
  );
}

// 01 — Integridad: one straight line running through nested, perfectly aligned forms.
function IntegrityScene() {
  return (
    <>
      <Draw d="M240 14 V286" i={0} />
      {[120, 84, 48].map((size, k) => (
        <rect
          key={size}
          x={-size / 2}
          y={-size / 2}
          width={size}
          height={size}
          rx={5}
          transform="translate(240 150) rotate(45)"
          pathLength={1}
          className={styles.draw}
          style={at(k + 1)}
        />
      ))}
      {[30, 60, 90, 120, 180, 210, 240, 270].map((y, k) => (
        <Draw key={y} d={`M${y % 60 === 0 ? 232 : 236} ${y} H${y % 60 === 0 ? 248 : 244}`} i={k * 0.2 + 1} />
      ))}
      <Draw d="M221 152 L235 166 L261 134" i={4} />
      <Node x={240} y={14} r={4} i={5} />
      <Node x={240} y={286} r={4} i={5} />
    </>
  );
}

// 02 — Honestidad: translucent panes and a beam that crosses all of them unobstructed.
function HonestyScene() {
  return (
    <>
      {[
        { x: 128, y: 82, w: 96, h: 136 },
        { x: 192, y: 68, w: 96, h: 164 },
        { x: 256, y: 54, w: 96, h: 192 },
      ].map((pane, k) => (
        <g key={pane.x}>
          <rect
            x={pane.x}
            y={pane.y}
            width={pane.w}
            height={pane.h}
            rx={6}
            className={styles.glass}
            style={at(k)}
          />
          <rect
            x={pane.x}
            y={pane.y}
            width={pane.w}
            height={pane.h}
            rx={6}
            pathLength={1}
            className={styles.draw}
            style={at(k)}
          />
        </g>
      ))}
      <Draw d="M40 150 H440" i={2} />
      <Node x={176} y={150} r={4} i={4} />
      <Node x={240} y={150} r={4} i={4.5} />
      <Node x={304} y={150} r={4} i={5} />
      <Node x={40} y={150} r={3} i={3} hollow />
      <Node x={440} y={150} r={3} i={5.5} hollow />
    </>
  );
}

// 03 — Respeto: distinct orbits that share one centre without ever colliding.
function RespectScene() {
  const orbits = [
    { rx: 62, ry: 36, rot: -18, node: { x: 62, y: 0, r: 6 } },
    { rx: 108, ry: 66, rot: 14, node: { x: -108, y: 0, r: 9 } },
    { rx: 158, ry: 96, rot: -4, node: { x: 0, y: -96, r: 5 } },
  ];
  return (
    <>
      {orbits.map((o, k) => (
        <g key={o.rx} transform={`translate(240 150) rotate(${o.rot})`}>
          <ellipse rx={o.rx} ry={o.ry} pathLength={1} className={styles.draw} style={at(k)} />
          <g className={styles.orbit} style={{ animationDuration: `${26 + k * 9}s` }}>
            <Node x={o.node.x} y={o.node.y} r={o.node.r} i={k + 3} />
          </g>
        </g>
      ))}
      <Node x={240} y={150} r={10} i={2} />
      <circle cx={240} cy={150} r={20} className={styles.ring} />
    </>
  );
}

// 04 — Trabajo en equipo: six nodes converging on one shared centre.
function TeamScene() {
  const pts = Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k - Math.PI / 2;
    return { x: 240 + Math.cos(a) * 108, y: 150 + Math.sin(a) * 108 };
  });
  const hull = `M${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')} Z`;
  return (
    <>
      <Draw d={hull} i={0} />
      {pts.map((p, k) => (
        <Draw
          key={`s${k}`}
          d={`M${p.x.toFixed(1)} ${p.y.toFixed(1)} L240 150`}
          i={k * 0.25 + 1}
          dashed
        />
      ))}
      {pts.map((p, k) => (
        <Node key={`n${k}`} x={+p.x.toFixed(1)} y={+p.y.toFixed(1)} r={9} i={k * 0.25 + 2} hollow />
      ))}
      <Node x={240} y={150} r={15} i={3.5} />
      <circle cx={240} cy={150} r={26} className={styles.ring} />
    </>
  );
}

// 05 — Humildad: an ascending staircase; there is always a next step to learn.
function HumilityScene() {
  const steps = [0, 1, 2, 3, 4];
  return (
    <>
      {steps.map((k) => {
        const h = 40 + k * 34;
        return (
          <rect
            key={k}
            x={92 + k * 64}
            y={250 - h}
            width={64}
            height={h}
            className={styles.glass}
            style={{ ...at(k), opacity: 0.4 + k * 0.12 }}
          />
        );
      })}
      <Draw d="M92 250 V210 H156 V176 H220 V142 H284 V108 H348 V74 H412" i={0} />
      <Draw d="M156 210 C170 150, 250 130, 316 98" i={3} dashed />
      <Node x={124} y={196} r={6} i={2.5} />
      <Node x={412} y={74} r={5} i={5} hollow />
      <Draw d="M412 74 V54" i={5.5} />
    </>
  );
}

// 06 — Compromiso: a ring that closes, sealed at its centre.
function CommitmentScene() {
  return (
    <>
      <circle cx={240} cy={150} r={104} className={styles.track} />
      <circle
        cx={240}
        cy={150}
        r={104}
        pathLength={1}
        className={`${styles.draw} ${styles.arc}`}
        style={at(0)}
        transform="rotate(-90 240 150)"
      />
      <circle
        cx={240}
        cy={150}
        r={74}
        pathLength={1}
        className={`${styles.draw} ${styles.dashed}`}
        style={at(2)}
      />
      {Array.from({ length: 36 }, (_, k) => {
        const a = (Math.PI * 2 * k) / 36;
        const inner = k % 3 === 0 ? 116 : 120;
        return (
          <Draw
            key={k}
            d={`M${(240 + Math.cos(a) * inner).toFixed(1)} ${(150 + Math.sin(a) * inner).toFixed(1)} L${(
              240 + Math.cos(a) * 128
            ).toFixed(1)} ${(150 + Math.sin(a) * 128).toFixed(1)}`}
            i={1 + k * 0.03}
          />
        );
      })}
      <rect
        x={-24}
        y={-24}
        width={48}
        height={48}
        rx={5}
        transform="translate(240 150) rotate(45)"
        className={styles.seal}
        style={at(4)}
      />
      <Draw d="M226 151 L237 162 L256 138" i={5} />
    </>
  );
}

export const pillarScenes: Readonly<Record<CulturePillarVisual, () => ReactElement>> = {
  integrity: IntegrityScene,
  honesty: HonestyScene,
  respect: RespectScene,
  teamwork: TeamScene,
  humility: HumilityScene,
  commitment: CommitmentScene,
};

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const pillarIcons: Readonly<Record<CulturePillarVisual, () => ReactElement>> = {
  integrity: () => (
    <svg {...iconProps}>
      <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8 7.5 9.5 4.4-1.5 7.5-5.1 7.5-9.5V6L12 3Z" />
      <path d="m8.8 12.2 2.3 2.3 4.2-4.6" />
    </svg>
  ),
  honesty: () => (
    <svg {...iconProps}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  respect: () => (
    <svg {...iconProps}>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" />
    </svg>
  ),
  teamwork: () => (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="2.4" />
      <circle cx="12" cy="4.5" r="1.8" />
      <circle cx="4.8" cy="16.5" r="1.8" />
      <circle cx="19.2" cy="16.5" r="1.8" />
      <path d="M12 6.3v3.3M6.3 15.6l3.6-2.2M17.7 15.6l-3.6-2.2" />
    </svg>
  ),
  humility: () => (
    <svg {...iconProps}>
      <path d="M3.5 20.5h4v-4h4v-4h4v-4h5" />
      <path d="M17 4.5h3.5V8" />
      <path d="m20.5 4.5-5 5" />
    </svg>
  ),
  commitment: () => (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
};
