# Documenting the guide's reach and use

The purpose of this workflow is to preserve accurate, reproducible records of readership and educational use.

## Preserve the work itself

- Keep dated Git commits, tagged releases, correction history, and reproducible source code.
- Save a PDF or full-page capture of significant published versions with their URL and capture date.
- Preserve authorship accurately. Distinguish your explanation, visuals, implementation, and experiments from the established methods introduced by the cited papers.
- Consider a DOI-backed archive for a reviewed release when ready. Do not list a DOI or publication venue until it actually exists.

## Monthly website record

Export the prior full calendar month from GA4 to CSV and PDF where supported. Keep the original exports unchanged, with screenshots of the reporting filters. Record:

| Field | What to preserve |
| --- | --- |
| Provenance | Property/stream identifier, report title, export date, account custodian |
| Scope | Site URL, date range, timezone, filters, consent configuration |
| Reach | Users, sessions, views, country breakdown, referral sources |
| Engagement | Engagement metrics and separately defined interaction events |
| Limitations | Sampling/thresholding, blocked traffic, internal-traffic exclusions, missing periods |
| Context | Release dates, talks, genuine external links, outreach or campaigns |

Store exports in `evidence-private/YYYY-MM/` or a private archive with backups. The local directory is ignored by Git and never copied into the website build. Do not put account screenshots, personal correspondence, private applications, or analytics exports into this public repository.

## GitHub is a separate measurement

Repository views and clones measure repository activity, **not GitHub Pages readership**. GitHub's traffic API provides a rolling 14-day window, so capture at least weekly if you need continuity. This repo includes:

```sh
npm run evidence
```

Supply an existing `GITHUB_TOKEN` through your environment or credential manager, never as a command-line argument or committed file. For a fine-grained token, traffic endpoints require **Administration: read** for this repository. Public metadata can be collected without a token. The script reports a nonzero exit status if any source is missing, saves raw successful responses and HTTP statuses, and records capture time, commit, and SHA-256 hashes in a manifest.

Overlapping captures must be deduplicated by date. Never sum overlapping rolling totals. Daily unique users cannot simply be summed to obtain monthly unique users. A checksum detects changes after capture; it does not independently authenticate the original API response. Keep originals and backups.

## External evidence is distinct from traffic

Keep a separate record of independently verifiable citations, course reading lists, external tutorials referencing the guide, documented reuse, invitations that cite the work, and substantive expert feedback. Preserve the original source URL, author, publication date, exact relevant passage, capture date, and permission or confidentiality constraints. Do not relabel a citation-button click as a scholarly citation or a website visit as an endorsement.

Use this record template in a private archive:

| Date | Evidence type | Source URL / original file | What it actually demonstrates | Independent source? | Limitations |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Avoid purchased traffic, manufactured testimonials, or selective reporting. If an outreach campaign causes a spike, preserve that context alongside the numbers.

GitHub source: [REST API for repository traffic](https://docs.github.com/en/rest/metrics/traffic).
