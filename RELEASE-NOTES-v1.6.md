# QuizDock v1.6

- Replaces the routine two-pass Sol/high board workflow with one schema-constrained Luna/medium call plus deterministic local validation.
- Adds generation progress, elapsed time, token reporting, bounded retries, and an in-memory cache for identical requests.
- Opens buzzers automatically after reading time and enforces buzzer and answer deadlines.
- Adds automated-host mode for clue selection, round progression, answer judging, and Final scoring.
- Fixes Double Jeopardy values on the host board.
- Adds explicit skip-to-Double and skip-to-Final controls.
- Fixes multi-contestant Final submissions with acknowledgements, submission receipts, early reveal, and one-time scoring.
- Adds custom HTTPS or `/downloads/` image, audio, and video clue support.
