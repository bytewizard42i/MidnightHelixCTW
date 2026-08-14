# Media Rights and Publication Ledger

No media may be published merely because it exists in a private repository.
This ledger records the source, intended use, rights status, trademarks, and
release decision for every copied or referenced asset.

## Approved source assets

| Destination | Source | Creator or owner | Intended use | Decision |
| --- | --- | --- | --- | --- |
| `docs/media/vision-deck/slide_01.png` through `slide_06.png` | Entrant-owned HelixCTW private repo | John S., Ai-assisted NotebookLM composition | Explain the target architecture and property hook | Include with `VISION` label |

The slide deck uses service names and logos to identify integrations. Those
names and marks remain the property of their respective owners. Their use does
not imply endorsement.

## Referenced but not copied

| Local source | Reason |
| --- | --- |
| `media/Draper-60-sec-pitch.mp4` | Keep raw video out of Git; use the transcript and narrative notes |
| `media/Midnight_Identity_Ecosystem (1).mp4` | Keep raw video out of Git; use chapter notes and claim review |
| `media/sound/agentic id smooth song.mp3` | Excluded because music rights are not documented and hackathon video rules are strict |
| `media/The_Privacy_Monolith.*` | Broad ecosystem deck, too large and not specific to this submission |
| `media/Universal_Identity_Substrate-slideshow-white.*` | Broad ecosystem deck, not required for the property-memory proof |
| `media/devpost hackathon thumbnail.png` | Older source thumbnail; replace with a truthful image made from the live judge flow |
| `media/helixCTW-hero.png` | Contains unsupported live-integration and immutable-truth claims; regenerate |
| `media/Privacy-Preserving_Protocol_Architecture_Overview.png` | Contains old naming, a watermark, and unverified provider strands; regenerate |
| `docs/CockroachDB_for_Identity_Access_Management.pdf` | Third-party Cockroach Labs publication; link the official source instead |
| `docs/media/existential-threat.jpg` | Not needed for the judge flow; rights and tone require separate review |
| archived v1 imagery and mindmaps | Stale, broad, or not submission-critical |

## Video policy

The final hackathon demonstration will:

- be newly recorded from the functioning public application;
- run less than three minutes;
- contain captions;
- show CockroachDB memory working;
- use no unlicensed music;
- avoid third-party footage; and
- use service names and marks only to identify actual integrations.

## Claim policy for vision slides

The six-slide deck describes the target architecture. It is not deployment
evidence. Any public page displaying the slides must include:

```text
VISION ARCHITECTURE. Live submission capabilities are identified separately by
REALDEAL_TEST, MOCK, PLANNED, and NOT CONNECTED evidence labels.
```

In particular, the slides cannot establish that Filecoin retrieval,
confidential inference, production ZK authorization, or whole-system
reconstruction is currently live.
