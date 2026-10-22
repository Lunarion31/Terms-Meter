# Terms Meter

A standalone Chrome / Edge Manifest V3 prototype. Shows a compact score-and-gradient pill at the top right of HTTP(S) pages using the ToS;DR public API.

## Load locally

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**, choose **Load unpacked**, and select this `Terms Meter` folder.
3. Open or reload a website. Click the pill to expand the review details; click it again or press Escape to collapse. Close the expanded card with × to gently fade it out and hide it on that hostname on future visits, including after a browser restart. This preference is saved locally; www and non-www versions share it, while other subdomains remain separate.

## Rating

Higher is better: A = 10, B = 7.5, C = 5, D = 2.5, E = 0. This is a display conversion of letter grades, not an official numeric ToS;DR score or an automated legal analysis. Missing reviews remain unrated; network failures are shown separately. Reviews that are not comprehensive are labeled.

Only listings matching the visited domain or its parent are accepted, with the longest domain match preferred. Path-specific service listings are excluded because this prototype rates domains, not individual products within a domain.

## Data and limitations

The extension sends the visited hostname (and, when needed, parent domains) to `api.tosdr.org`; no page text, full URL, query string, or browsing history is sent. ToS;DR still receives your network request, including your IP address. Results are cached locally for 24 hours, up to approximately 500 domains. Localhost and IP addresses are skipped. Restricted browser pages do not support content scripts. This prototype has not been published to an extension store.

API documentation: https://docs.tosdr.org/developer/tos-dr-developers/search

Run checks from this folder: `node --test tests/*.test.mjs`.
