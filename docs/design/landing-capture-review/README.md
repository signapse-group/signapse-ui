> Historical reference only: product screenshots were retired on 2026-10-02. The landing now renders every demo from code; these archived references are not runtime assets.

# Landing capture review — 2026-09-08

Four user-supplied screenshots were reviewed and cropped. Original files remain unchanged. The user approved integrating these four crops into the landing on 2026-09-08; AI Assistant and Telegram captures remain pending.

| Source                           | Locale | Feature         | Crop (left, top, width, height) | Output                                                  |
| -------------------------------- | ------ | --------------- | ------------------------------- | ------------------------------------------------------- |
| `source/1.png`    | vi     | Knowledge Graph | 345, 195, 1550, 720             | `vi/knowledge-graph.png`, `vi/knowledge-graph.webp`     |
| `source/1-en.png` | en     | Knowledge Graph | 345, 195, 1550, 720             | `en/knowledge-graph.png`, `en/knowledge-graph.webp`     |
| `source/2.png`    | vi     | Live Charts     | 345, 195, 1550, 742             | `vi/live-market-chart.png`, `vi/live-market-chart.webp` |
| `source/2-en.png` | en     | Live Charts     | 345, 195, 1550, 742             | `en/live-market-chart.png`, `en/live-market-chart.webp` |

Crops remove browser tabs/address bar, app sidebar/account identity, workspace header, and OS taskbar. Graph crops end above the bottom legend and floating assistant button, retaining the top node-kind labels; they are partial canvas views. Chart crops preserve the complete chart panel, including calendar, event popup, axes, legend, counts, connection state, and update timestamp. No resizing, redrawing, recoloring, or added text was performed. PNG and lossless WebP pixels were verified against the exact source rectangles; originals were verified unchanged.

## Findings

- Both graph captures show many overlapping or truncated labels, with the asset cluster left of center and substantial empty space to the right. The user accepted this level of detail for the landing proof; no further retake is required for this change.
- Both chart captures show XAU/USD at 1H with event markers, an event preview, upcoming calendar context, and a connection/status footer. These are usable review candidates.
- The Vietnamese chart visibly says `Đang kết nối lại`; the English chart says `Live price`. The Vietnamese state was retained. For matched live-state marketing captures, retake it after connection recovers rather than editing away the status.
- The chart locales differ in price/time framing and popup position. Match framing for a more consistent pair; do not alter captured numbers.
- The English event preview displays `1 events`, an existing UI wording issue preserved in the crop.
- Raw inputs are retained under this review folder and include the account name and desktop/browser chrome; they are no longer under `public/`. The runtime only references the cropped WebP outputs.

The four approved crops are integrated through the locale-specific landing media catalog. No AI or Telegram capture was supplied, so those chapters remain text-first.

The repeatable crop operation is recorded in `.scratch/landing/crop-product-captures.mjs`; it refuses to overwrite existing outputs.
