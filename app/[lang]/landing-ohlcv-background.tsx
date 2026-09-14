import styles from "./landing-page.module.css"

type Glyph = readonly [
  value: "$" | "€" | "£" | "¥" | "₫" | "₿" | "₹" | "₩",
  x: number,
  y: number,
  size: number,
]

const farGlyphs: readonly Glyph[] = [
  ["$", 42, 68, 18],
  ["€", 164, 126, 15],
  ["£", 286, 54, 16],
  ["¥", 402, 156, 14],
  ["₫", 532, 82, 17],
  ["₿", 666, 142, 15],
  ["₹", 790, 58, 16],
  ["₩", 918, 118, 14],
  ["$", 1050, 42, 17],
  ["€", 1182, 148, 15],
  ["£", 1356, 74, 16],
  ["¥", 84, 278, 15],
  ["₫", 222, 338, 17],
  ["₿", 354, 250, 14],
  ["₹", 484, 324, 16],
  ["₩", 618, 238, 15],
  ["$", 748, 354, 17],
  ["€", 882, 270, 14],
  ["£", 1010, 338, 16],
  ["¥", 1142, 248, 15],
  ["₫", 1280, 324, 17],
  ["₿", 1390, 264, 14],
  ["₹", 38, 506, 16],
  ["₩", 174, 604, 14],
  ["$", 312, 492, 17],
  ["€", 448, 626, 15],
  ["£", 584, 520, 16],
  ["¥", 720, 646, 14],
  ["₫", 858, 500, 17],
  ["₿", 994, 622, 15],
  ["₹", 1130, 516, 16],
  ["₩", 1266, 654, 14],
  ["$", 1398, 536, 17],
]

const nearGlyphs: readonly Glyph[] = [
  ["₿", 112, 188, 25],
  ["¥", 330, 112, 29],
  ["$", 570, 202, 24],
  ["€", 824, 178, 28],
  ["£", 1088, 204, 25],
  ["₫", 1328, 184, 30],
  ["₹", 118, 420, 28],
  ["₩", 382, 404, 24],
  ["$", 642, 438, 30],
  ["€", 906, 414, 25],
  ["£", 1162, 430, 28],
  ["₫", 1340, 400, 24],
  ["₹", 272, 674, 26],
  ["₿", 802, 682, 24],
  ["¥", 1212, 688, 29],
]

function GlyphLayer({ glyphs }: { glyphs: readonly Glyph[] }) {
  return glyphs.map(([value, x, y, size]) => (
    <text fontSize={size * 0.8} key={`${value}-${x}-${y}`} x={x} y={y}>
      {value}
    </text>
  ))
}

export function LandingOhlcvBackground() {
  return (
    <div
      aria-hidden="true"
      className={styles.heroOhlcvBackground}
      data-landing-decoration="ohlcv-depth-field"
    >
      <svg
        className={styles.heroOhlcvArtwork}
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 720"
      >
        <g className={styles.heroGlyphsFar}>
          <GlyphLayer glyphs={farGlyphs} />
        </g>
        <g className={styles.heroGlyphsNear}>
          <GlyphLayer glyphs={nearGlyphs} />
        </g>
      </svg>
    </div>
  )
}
