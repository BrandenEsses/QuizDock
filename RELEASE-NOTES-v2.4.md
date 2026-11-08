# QuizDock 2.4.0

- Doubles every built-in gameplay timer and adds host controls for all ten timer durations.
- Automatically reveals media clues; audio and video begin halfway through reading time.
- Keeps one media player alive through state updates so Cast playback no longer restarts, then stops it when the clue closes.
- Highlights the responding contestant in yellow on TV/Cast displays.
- Enlarges player and correct responses on audience displays and gives the host a private correct-response view.
- Plays Final Jeopardy music during the response window and the supplied `no.mp3` cue after an incorrect judgment.
- Resamples contestant latency and clock offset every five seconds, opens buzzers at a shared server timestamp, and fairly arbitrates near-simultaneous presses with a capped correction.
