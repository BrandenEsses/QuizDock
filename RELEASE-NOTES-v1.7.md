# QuizDock v1.7

- Autohost now gives a random contestant first control of the board and lets that contestant tap the next clue on a phone-friendly board.
- Board control passes to the last contestant whose response was judged correct.
- Spent clues use much darker, low-contrast slots on host, player, and TV boards.
- Standard boards receive one hidden Daily Double in Jeopardy and two in Double Jeopardy.
- Daily Doubles enforce exclusive answering, a 15-second private wager window, a $5 minimum, the greater-of-score-or-round-maximum wager rule, and a five-second response window.
- Hosts can download a complete reusable game JSON file and load it later.
- A separate settings-only loader fills the AI generation form without replacing the current board, so the settings can be edited and used to generate a fresh game.
- Daily Double locations are not stored in exported files; loading a game randomizes them again.
