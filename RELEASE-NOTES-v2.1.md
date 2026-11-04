# QuizDock v2.1

- Fixed standard answer submission in Double Jeopardy and added explicit submit acknowledgements.
- Typed standard answers autosubmit when answer time expires. Typed Final wagers and Final responses are also retained server-side for their deadlines.
- Final forms no longer rebuild when another contestant submits, so in-progress wagers, typed responses, and handwriting stay intact.
- Final Jeopardy has a generated/importable category shown during wagering on contestant, host, TV, and Cast screens.
- Automated-host rounds now have a configurable ten-minute clock on every screen; timeout plays the time-up cue and advances the round.
- TV-only and Cast displays show the room code.
- Native Cast requests `VIDEO_OUT`, excluding audio-only receivers from its device picker.
- Pexels/Freesound results must match canonical-answer metadata. Accepted clues are rewritten so the media is essential to answering.
- Added staggered board population animation with `board-fill.mp3` and Final clue reveal with `appear.mp3`.
- Moved the private rejoin link to a compact disclosure panel at the bottom.
