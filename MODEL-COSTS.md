# Model quality and cost choices

QuizDock separates the expensive, infrequent game-writing job from the frequent, short answer checks:

- `OPENAI_BOARD_MODEL=gpt-6.1-sol` with `OPENAI_BOARD_REASONING=high` is the default. It balances quality and cost for creating and editing 61 clues.
- `OPENAI_JUDGE_MODEL=gpt-6-luna` with `OPENAI_JUDGE_REASONING=low` is the default for fast advisory checks after each response.
- For maximum board quality, try `gpt-6-astra`; it costs substantially more. For the cheapest generation, use `gpt-6-luna`, but expect more retries or manual editing.

As of October 19, 2026, official standard API rates per one million tokens are:

| Model | Input | Output | Good use here |
|---|---:|---:|---|
| `gpt-6-astra` | $10.00 | $50.00 | Highest-quality board generation |
| `gpt-6.1-sol` | $2.00 | $10.00 | Recommended board generation/validation |
| `gpt-6-luna` | $0.10 | $0.50 | Automatic answer suggestions; budget boards |

Actual cost depends on token use, reasoning, retries, and processing tier. For a rough illustration, a two-pass board workflow using 12,000 input and 20,000 output tokens would cost about $0.22 with Sol, $1.12 with Astra, or $0.011 with Luna. A Luna answer check using 500 input and 100 output tokens is about $0.0001. These are examples, not guarantees.

Current official references:

- https://developers.openai.com/api/docs/models
- https://developers.openai.com/api/docs/pricing

Set an API project budget and review actual usage in the OpenAI dashboard. Increasing reasoning can improve difficult editorial work but consumes more output/reasoning tokens and increases latency and cost.
