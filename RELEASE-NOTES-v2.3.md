# QuizDock v2.3

## Iterative game validation

- Added a public, room-free `GET /api/validate-game` guide that AI chatbots can read.
- Added `POST /api/validate-game` for complete QuizDock game objects.
- Accepts either a raw JSON request body or a memory-only multipart JSON file in the `file` field.
- Valid games receive a concise board summary.
- Rejected games receive all detected issues with stable codes, exact JSON-style paths, explanations, and repair suggestions.
- Added **Check board** to the visual designer.
- A designed board must pass validation before QuizDock creates or loads its room.
