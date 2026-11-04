# QuizDock v2.0

- Optional free-media enrichment uses Pexels for photos/video and Freesound for audio. Media files are downloaded locally with provider attribution and no generative-media cost.
- The clue-selecting contestant decides when to reveal or play board media. TV/host/player displays wait, and reading/response timers do not start early.
- Daily Double media is released after the wager, followed by the configured reading and answer intervals.
- Hosts can download a reusable ZIP containing `game.json`, a README, and all local media assets, while the existing JSON-only and settings-only workflows remain available.
- The board generator includes a zero-to-six media-clue setting, reports how many assets it attached, and gracefully creates a text-only game when provider keys are absent.
- Media source, credit, provider, and license metadata are validated, displayed, exported, and retained on import.

Required only for optional media enrichment:

```sh
PEXELS_API_KEY=...
FREESOUND_API_KEY=...
```
