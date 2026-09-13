import styles from "./landing-page.module.css"

type Glyph = readonly [
  value: "O" | "H" | "L" | "C" | "V",
  x: number,
  y: number,
  size: number,
]

const farGlyphs: readonly Glyph[] = [
  ["O", 42, 68, 18],
  ["H", 164, 126, 15],
  ["L", 286, 54, 16],
  ["C", 402, 156, 14],
  ["V", 532, 82, 17],
  ["O", 666, 142, 15],
  ["H", 790, 58, 16],
  ["L", 918, 118, 14],
  ["C", 1050, 42, 17],
  ["V", 1182, 148, 15],
  ["O", 1356, 74, 16],
  ["L", 84, 278, 15],
  ["C", 222, 338, 17],
  ["V", 354, 250, 14],
  ["O", 484, 324, 16],
  ["H", 618, 238, 15],
  ["L", 748, 354, 17],
  ["C", 882, 270, 14],
  ["V", 1010, 338, 16],
  ["O", 1142, 248, 15],
  ["H", 1280, 324, 17],
  ["C", 1390, 264, 14],
  ["V", 38, 506, 16],
  ["O", 174, 604, 14],
  ["H", 312, 492, 17],
  ["L", 448, 626, 15],
  ["C", 584, 520, 16],
  ["V", 720, 646, 14],
  ["O", 858, 500, 17],
  ["H", 994, 622, 15],
  ["L", 1130, 516, 16],
  ["C", 1266, 654, 14],
  ["V", 1398, 536, 17],
]

const nearGlyphs: readonly Glyph[] = [
  ["V", 112, 188, 25],
  ["C", 330, 112, 29],
  ["O", 570, 202, 24],
  ["L", 824, 178, 28],
  ["H", 1088, 204, 25],
  ["V", 1328, 184, 30],
  ["H", 118, 420, 28],
  ["L", 382, 404, 24],
  ["C", 642, 438, 30],
  ["V", 906, 414, 25],
  ["O", 1162, 430, 28],
  ["H", 1340, 400, 24],
  ["O", 272, 674, 26],
  ["C", 802, 682, 24],
  ["L", 1212, 688, 29],
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
