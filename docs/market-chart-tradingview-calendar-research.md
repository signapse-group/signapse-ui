# Market Chart: TradingView Calendar Research

- Type: Research note; exploration only, not an approved implementation task.
- Audience: Product, frontend, QA.
- Researched: 2026-09-07.
- Scope: TradingView's first-party economic calendar behavior and implications for Signapse upcoming-event visibility.

## Verified TradingView Behavior

TradingView describes its calendar as preparation for upcoming market events, explicitly including FOMC meetings and unemployment reports. Users can access it independently or within Supercharts. This establishes advance visibility as a product purpose. [Calendar overview](https://www.tradingview.com/support/solutions/43000707391-tradingview-calendar-key-economic-and-corporate-events/)

The calendar supports upcoming, yesterday, today, tomorrow, and this-week filters. Users can filter by country, importance and category, and choose their time zone. Event details include release time, country, importance, description, actual, forecast and prior values. Actions include an indicator chart, indicator overview, and adding the event to Google Calendar. Supercharts provides calendar access through its right toolbar and supports a resizable split view. Economic events can also appear on the chart timeline, depending on asset type. [Economic Calendar guide](https://www.tradingview.com/support/solutions/43000759911-economic-calendar-track-all-major-market-events/)

The public calendar additionally documents choosing a specific day or the desired week through its toolbar. Its documented navigation is therefore broader than events attached to the currently loaded price candles. The latter is a product-level inference; it does not reveal TradingView's internal request strategy. [Public calendar and FAQ](https://www.tradingview.com/economic-calendar/)

Chart event dots are enabled through chart settings, Events, “Show Economic Events on Chart.” This is an overlay setting, separate from the calendar's period controls. [Chart event settings](https://www.tradingview.com/support/solutions/43000494798-how-can-i-enable-disable-colored-circles-dots-of-economic-events-on-a-chart/)

TradingView's public Advanced Charts documentation describes a related datafeed pattern: bar marks and time-scale marks are separate surfaces, and the library requests marks for the visible data range. The UDF contract passes the leftmost and rightmost visible timestamps as `from` and `to` for both `/marks` and `/timescale_marks`. This is useful architectural evidence for a viewport-driven marker request, but it is not proof of the private Supercharts implementation or of a fixed future preload horizon. [Marks](https://www.tradingview.com/charting-library-docs/latest/ui_elements/Marks/), [UDF marks endpoints](https://www.tradingview.com/charting-library-docs/latest/connecting_data/UDF/)

The same documentation separates the range of visible bars from the visible time range: `getVisibleBarsRange()` excludes future bar times, while `getVisibleRange()` represents the current time range. A configured historical range still causes the library to request data up to the current date so the user can scroll forward after load. This points to a deliberate distinction between loading real price bars and allowing navigation through time; it still does not document how built-in economic-event markers are preloaded beyond the last bar. [IChartWidgetApi](https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.IChartWidgetApi/), [ChartingLibraryWidgetOptions](https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.ChartingLibraryWidgetOptions/)

## Known Limits Of This Research

- The examined official documentation does **not** specify a fixed 7-day, 30-day, or other forward preload horizon for chart event markers.
- It does not establish exactly how far future markers extend beyond the latest candle, how blank future chart space is allocated, or how requests follow panning/zooming.
- Advanced Charts documentation is an integration contract, not documentation of TradingView's private Supercharts implementation; use it as an architectural analogue only.
- Specific-day/week navigation is verified; a freely selectable arbitrary start/end range and its maximum limits are not verified.
- Adding an event to Google Calendar is documented. Native automatic push reminders N minutes before an economic event are not established by these sources; absence from these documents does not prove absence from the product.
- Third-party Pine scripts hosted on TradingView were excluded from evidence about TradingView's built-in behavior.

## Implications For Signapse

These are design recommendations inferred from the verified product behavior, not claims about TradingView internals:

1. Give upcoming events a query interval based on current time and the user's selected calendar period. Do not make advance visibility depend solely on the last loaded candle.
2. Keep an accessible Upcoming list alongside timeline markers. Users should be able to inspect scheduled events even when their times fall outside the chart viewport.
3. Treat fetching future events and rendering future markers as separate problems. Extending the request alone does not ensure those events become visible.
4. Consider a rolling seven-day initial window as a Signapse starting proposal, then explicit day/week navigation. Seven days is **our proposed default**, not a verified TradingView limit.
5. Separate viewing a schedule from subscribing to a reminder. Confirm reminder requirements independently if notifications enter scope.

The practical split is therefore:

- Calendar surface: query a user-selected upcoming period such as upcoming, tomorrow, this week, a day, or a week; this surface must work even when no future price candles exist.
- Chart overlay: query or filter events for the chart's visible time range; only attach an event to a candle when the chart has a valid time coordinate for it.
- Future visibility: if Signapse wants a marker beyond the latest candle, it needs either a real future-time scale/canvas margin or a separate upcoming-event lane/list. Merely sending a later `to` to the calendar endpoint cannot create a chart coordinate by itself.

The current implementation restricts calendar fetching to the displayed candle interval and keeps future events without matching candles in the quick list instead of extending the chart. Changing this requires revisiting that behavior rather than merely increasing an implementation constant.

## Agreed Requirements

The user accepted the proposed first-release scope on 2026-09-07: a rolling seven-day lookahead with a 24-hour view, an asset-relevant next-event summary, an upcoming list, future markers within the chart viewport, HIGH impact by default, independent calendar loading, refresh every minute while visible and on returning to the tab, and client-side time remaining. Farther date exploration uses the existing Economic Calendar page. Push and Telegram reminders are outside this change.

The installed KLineCharts 10.0.0 already extrapolates timestamps beyond the last candle when a period is configured (`node_modules/klinecharts/dist/index.esm.js`, `timestampToDataIndex`). The canvas configures that period and has right-offset support. A new chart engine or separate time axis is therefore not an established prerequisite. Future-marker placement across market closures and month boundaries still needs verification.

The user confirmed all three follow-up recommendations on 2026-09-07. These decisions close the product-requirement interview:

- Rename the Calendar visibility control to “Hiện lịch trên biểu đồ” (localized equivalent in other languages). It controls chart markers and their associated visual lane/guide/legend; the upcoming list and next-event summary remain available. This intentionally replaces the existing whole-layer toggle semantics.
- When an event reaches its scheduled time and remains PENDING, advance the next-event summary to the next upcoming event and retain the due event in “Chờ công bố” for at most 60 minutes after its scheduled time. Receiving AVAILABLE removes it from the waiting group. The elapsed window only removes the item from that group; it does not mean the announcement was published or cancelled. Reloading the page must not restart the window.
- Apply the rolling 24-hour/seven-day selector to the upcoming list and next-event summary only. Keep historical chart markers and the fetched seven-day future marker coverage independent of this selector. The selected impact levels still apply consistently to the list, summary, waiting group, and markers.

Subsequent interaction simplification: remove the aggregate calendar-count popover in the chart footer (`MarketChartAnnotationControls`, the “{count} sự kiện lịch kinh tế” trigger). Keep any retained count as non-interactive metadata. This removes the duplicate aggregate-list entry point; the upcoming list remains accessible through the agreed next-event summary, including an explicit list entry when no next event is present. Popovers attached to individual or grouped chart markers continue to expose the events at that chart position. This refinement is scoped to the footer count trigger, not all calendar popovers.

Acceptance examples:

- A user viewing a one-minute chart can discover a relevant HIGH event several days ahead without changing chart timeframe or zooming to fit seven days.
- Turning off chart markers leaves the next-event summary and upcoming list usable.
- The aggregate calendar count in the footer is not an interactive button and does not open a popover. Users can still access the upcoming list and inspect individual or grouped chart markers.
- An event due at 19:30 that remains PENDING can appear in the waiting group until 20:30; neither a refresh at 20:00 nor switching timeframes extends that deadline.
- Selecting 24 hours filters the upcoming list and next-event summary without hiding a loaded future chart marker two days ahead.
- A calendar fetch failure is distinguishable from no matching scheduled events and does not prevent viewing loaded price candles. Seven-day query coverage is not presented as a guarantee that the provider has supplied every future announcement.

Technical facts to resolve before implementation: the backend's supported future coverage, the meaning and precedence of required `time` versus optional `scheduledAt`, and its publication-status semantics. These are contract investigations, not user preference questions. Current API mapping defines AVAILABLE as published, but does not define an overdue timeout. No new ADR is warranted for these reversible presentation choices.
