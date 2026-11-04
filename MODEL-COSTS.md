# Model quality, speed, and cost

QuizDock separates the infrequent game-writing job from the frequent, short answer checks.

## Defaults

- `OPENAI_BOARD_MODEL=gpt-6-luna` with `OPENAI_BOARD_REASONING=medium` is the balanced default. The prompt is tightly scoped, Structured Outputs enforce the game shape, and local code checks counts, duplicate concepts, repeated answers, similar clues, and answer leakage.
- `OPENAI_JUDGE_MODEL=gpt-6-luna` with `OPENAI_JUDGE_REASONING=low` handles short advisory answer checks.
- A successful board uses one model call. The previous full-board editorial rewrite was removed because it roughly doubled latency and generated tokens.
- A second board call happens only when the first result fails local validation. Set `AI_GENERATION_ATTEMPTS=1` for the strictest spend ceiling, at the cost of more visible failures.
- Identical requests are cached in memory for `AI_GAME_CACHE_TTL_SECONDS` (one hour by default), so an immediate retry costs no additional API tokens.

## Quality options

If representative games do not meet the desired quality bar, change one setting at a time:

1. Raise `OPENAI_BOARD_REASONING` from `medium` to `high` while keeping Luna.
2. If that is still insufficient, use `OPENAI_BOARD_MODEL=gpt-6.1-sol` with `OPENAI_BOARD_REASONING=low` or `medium`.
3. Keep Luna/low for answer judging; those checks are narrow and advisory.

Avoid restoring a routine second full-board rewrite. It duplicates the largest output in the workflow. Prefer improving the generation prompt or adding deterministic validation for a recurring defect.

## Measure

The host UI reports elapsed time and total input/output tokens for each generated game. Cached games show zero API tokens. Actual cost depends on model, processing tier, generated length, reasoning tokens, and retries.

Current official references:

- https://developers.openai.com/api/docs/guides/model-selection
- https://developers.openai.com/api/docs/guides/latency-optimization
- https://developers.openai.com/api/docs/guides/cost-optimization
- https://developers.openai.com/api/docs/pricing
