# SIGN-543 Next badge plot evidence

The accepted direction is [parent SIGN-459](https://signapse-group.atlassian.net/browse/SIGN-459), attachment 10181, `SIGN-459-Upcoming-badge.png`. The reference places the Next event at the lower left of the plot above the time axis. Event and time metadata plus the title form the left group; a divider separates the Remaining label and countdown on the right.

These candidate renders were captured by the focused local fixture browser case in [`market-chart.spec.ts`](../../../../tests/e2e/market-chart.spec.ts). The fixture uses Vietnamese locale, a fixed time of 2026-01-15 08:00 UTC, one upcoming event, and hidden calendar markers. Normal dashboard captures use the expanded sidebar. Fullscreen captures show the fullscreen chart surface.

The closed-state renders show the trigger in the plot with surrounding axes and toolbar visible. Its location and information grouping match the accepted reference. The toolbar and More menu contain no replacement trigger. Responsive checks confirm the badge remains visible and the page has no horizontal overflow while resizing through 360, 390, 767, 768, 760, 1024, 1439, 1440, and 1520 CSS-pixel widths. The detail renders show the same shared event detail opened from the badge; Escape returns focus to the trigger. Local fixture evidence does not represent live QA or parent acceptance; QA execution remains with SIGN-493 after delivery.

## Next badge closed

- [Wide, dark, 1520×1024](next-closed-wide-dark-1520x1024.png)
- [Compact, dark, 1024×768](next-closed-compact-dark-1024x768.png)
- [Mobile, light, 390×844](next-closed-mobile-light-390x844.png)
- [Fullscreen, dark, 1520×1024](next-closed-fullscreen-dark-1520x1024.png)

## Shared detail open

- [Wide, dark, 1520×1024](detail-open-wide-dark-1520x1024.png)
- [Compact, dark, 1024×768](detail-open-compact-dark-1024x768.png)
- [Mobile, light, 390×844](detail-open-mobile-light-390x844.png)
- [Effective 200% layout width, 760×512](detail-open-effective-200pct-760x512.png)
- [Fullscreen, dark, 1520×1024](detail-open-fullscreen-dark-1520x1024.png)
