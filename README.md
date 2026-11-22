# AbusePulse

[Open AbusePulse on CoolCode.ca](https://coolcode.ca/abusepulse/)

Explore six-month Canadian Radio-television and Telecommunications Commission (CRTC) snapshots of the Spam Reporting Centre (SRC) and enforcement of Canada’s Anti-Spam Legislation (CASL). The dataset covers April 2020 through March 2026.

<!-- coolcode:guide -->
Choose one of 12 reporting periods to inspect online-form message channels, SMS spam types, ranked scam categories and published enforcement measures. Compare half-years by intake, weekly average, notices to produce or preservation demands. Download a long-form CSV with original category labels, units, qualifiers and official source links. The records panel links to an existing ISED release summary and identifies the missing monthly phishing counts and category definitions for a focused CRTC request.
<!-- /coolcode:guide -->

## Sources and interpretation

Each record in [the reviewed dataset](web/data/snapshots.json) links to its originating CRTC snapshot. Period dates are the coverage of the statistics. The review date records when the collection was checked. The entire site builds from the committed snapshot offline.

* Submission totals count reports before validation. A domain, person or incident can appear more than once. Online forms are included in those totals. The dashboard preserves the CRTC’s “over” and “approximately” qualifiers.
* Message-channel and SMS percentages apply to their respective online-form subsets. Rounding can affect totals. The published ranking is ordinal, with no counts or percentages implied.
* The April–September 2025 SMS categories list phishing and scams separately. October 2025–March 2026 combines them. The series preserves those labels and keeps each breakdown in its own period.
* Enforcement figures count the listed regulatory measures. A letter count can include information letters where the CRTC uses a combined label. Missing categories are left unreported. The releases do not connect these actions to particular complaints or domains.
* In two older reports the alternative text for an image disagrees with the accompanying text. The dashboard uses the written narrative and flags the discrepancy for the selected period.
* The completed ATIP record for ISED A-2026-00004 points to a previous release. Only its catalogue summary was reviewed here. Submission-level information and personal data are outside this dataset.

## Maintaining the snapshot

Start with the [CRTC spam and malware page](https://crtc.gc.ca/eng/internet/anti.htm). For each new six-month release, add a record in chronological order with start and end dates, its official source URL, narrative submission total and qualifier, weekly average and qualifier, and the approximate number of online forms. Copy the official message-channel and SMS percentages, ranked scam categories, and counts of enforcement actions listed in the report. Leave a breakdown empty when absent. Record discrepancies in the period note, review the result, then update the review date and coverage descriptions. Changes to the publication’s methodology should be documented before comparing the affected measures.

## Run locally

Run the following from the repository root:

```sh
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -v
python3 scripts/build.py
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000/. To run the browser checks, install the test-only Playwright requirements, install Chromium via Playwright and run `python3 tests/browser_smoke.py`. Set `CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium installation.

The production page processes selections locally and stores their shareable state in the URL fragment. The shared CoolCode metrics script can count a page visit. The app sends no filter choices to an API.
