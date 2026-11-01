# Activating visitor analytics

## Current integration

The repository supports Google Analytics 4 (GA4). It sends nothing to Google while the measurement ID is blank. Even after configuration it loads only on `rishabhpatil.github.io` after visitor opt-in. Global Privacy Control or Do Not Track disables it. No billing setup, account creation, or property configuration is performed by the code.

## One-time property setup

1. In [Google Analytics](https://analytics.google.com/), create or choose a GA4 property for this guide. Keep the account under your own control. Use one consistent reporting timezone (for example America/Los_Angeles) and record it in exports.
2. Create a **Web data stream** for `https://rishabhpatil.github.io/pe-understanding/`. Copy its **Measurement ID**, which starts with `G-`. This is a public identifier, not a secret or API key.
3. **Disable Enhanced Measurement for this stream.** The site sends its own explicit events. This avoids duplicate page/scroll/download events and automatic capture of link URLs or search parameters outside the site's allowlist. Do not enable user-provided data collection, Google signals, ad personalization, or link the property to advertising products for this use case.
4. Choose the property's data retention setting deliberately and record it. Fourteen months, if available in your property, can help with longitudinal exploration; it is not a substitute for periodic exports. Review regional granular-location/device controls to collect only what you need.
5. In [repository variables](https://github.com/RishabhPatil/pe-understanding/settings/variables/actions), add `GA_MEASUREMENT_ID` with the `G-…` value. Use a repository variable; the workflow reads `vars.GA_MEASUREMENT_ID`.
6. Run the Pages workflow again. The ID is inserted into `dist/config.js` at build time. Changing a variable alone does not redeploy an existing site.
7. Open the deployed site, accept analytics, and verify one page view in GA4 Realtime. Change a tab, move a slider, and copy the code. Reporting may take time to populate. Test in a browser without ad blocking or privacy signals, then restore your usual settings.
8. Decline via **Analytics preferences** and verify no subsequent collection. The page reloads on withdrawal to stop the loaded SDK. Already transmitted data is not deleted by this action.
9. Configure internal/developer traffic exclusions after validating them in testing mode. Keep the initial setup visits out of later reach claims.

Do not enable a second GA tag through another template, tag manager, or plugin. It could bypass consent or double-count visits. Local builds can use an environment variable, but previews still suppress collection by hostname.

## Events and interpretation

| Event | Trigger | Interpretation |
| --- | --- | --- |
| `page_view` | Once after accepted consent on page load | Measured page load, not a unique person |
| `method_select` | Method tab selected | Engagement with a method; includes its name |
| `explorer_interaction` | A slider/select change completes or paired shift is clicked | An interaction, not learning demonstrated |
| `article_read` | References are visible after 60 seconds of visible-page time | A reading proxy, not proof of comprehension; at most once per load |
| `code_copy` | Clipboard write succeeds | Code copied, not verified reuse |
| `citation_download` | Citation link clicked | Download intent, not an independent citation |
| `reference_click` | A link in the references list is clicked | Interest in the underlying paper |
| `source_click` | A source link is clicked | Interest in implementation |

Optionally register `method` as an event-scoped custom dimension to break down sinusoidal/RoPE/ALiBi usage. GA4 may also emit SDK-managed engagement/session events after consent. Our explicit page URL strips query strings and fragments, and the referrer is reduced to its origin. This limits campaign attribution; add only a reviewed allowlist if UTM reporting becomes important.

## What to report

Use monthly users, sessions, page views, country-level reach, referring sites, engagement, and the defined interaction counts. Export the same date range and timezone each month. Keep users, visits, events, downloads, citations, and repository stars as separate measurements.

Consent refusals, browser blocking, bots, cookie deletion, multiple devices, and analytics definitions affect these counts. Never describe them as a complete census of readers or a verified list of professionals. Analytics cannot identify which employers or experts visited this guide. Do not add fingerprinting or identity inference for that purpose.

## Official documentation

- [Create and set up Analytics](https://support.google.com/analytics/answer/9304153)
- [Google consent mode](https://developers.google.com/tag-platform/security/guides/consent)
- [GA4 enhanced measurement](https://support.google.com/analytics/answer/9216061)
- [GA4 data retention](https://support.google.com/analytics/answer/7667196)
- [Regional data and privacy controls](https://support.google.com/analytics/answer/12017362)

If switching to Plausible or another provider, replace the integration and update the privacy text together. Do not simply add another tracking script.
