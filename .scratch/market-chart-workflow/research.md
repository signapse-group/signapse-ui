# Market Chart workflow research

Date: 2026-09-16. Scope: landing-page scenario research; no application implementation.

## Existing implementation

- `app/[lang]/landing-feature-showcase.tsx`: Market Chart renders StaticCaptureProof. Knowledge Graph loads its own automatic demo.
- `app/[lang]/landing-knowledge-graph-demo-model.ts`: Knowledge Graph lasts 22.5 seconds; incoming news at 3 seconds, processing through 11 seconds, then simulated cursor inspections.
- `app/[lang]/landing-knowledge-graph-demo.tsx`: news alert uses bell, title, publisher/time, changing processing status, progress bar, extracted facts, and completion state. This is the strongest existing visual reference for the requested chart alert.
- `app/lib/i18n/dictionaries/vi.ts`: existing graph story concerns XAU/USD and weak US retail sales. Treat its figures and headlines as demo content, not verified current news.
- `app/lib/market-charts/definitions.ts`: hot-event annotations support direction, summary, confidence, evidence, market reaction reasoning and separate outcome data.

## Primary-source references

- [TradingView realtime demo](https://tradingview.github.io/lightweight-charts/tutorials/demos/realtime-updates): demonstrates simulated realtime updates via series.update. Useful behavioral reference: mutate the forming candle, then append the next candle; do not simply translate a static chart image.
- [TradingView series markers](https://tradingview.github.io/lightweight-charts/tutorials/how_to/series-markers): annotations attach to a specific chart point. Useful reference: preserve the annotation's time anchor as later candles arrive.

These sources inform behavior; they do not prescribe a library migration.

## Scenario recommendation

Use a 26-second simulated XAU/USD sequence: 0–3 live-looking ticks; 3–6 incoming news alert; 6–10 visibly combine two demo sources and derive a bullish interpretation; 10–12 insert a time-anchored annotation; 12–14 simulated cursor clicks it; 14–19 read compact adjacent detail while ticks continue; 19–24 new candles rise with a small pullback; 24–26 hold the result before replay.

Label simulated data and compressed time. Keep forecast visible before the outcome. Separate expected direction from observed price movement. Use synthetic source names unless real headlines and attribution are verified. Provide pause/replay and a reduced-motion readable state. This is a proposed storyboard, not implemented or validated UI.
