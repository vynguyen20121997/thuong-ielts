# Kiểm tra nền tảng IELTS

Source: the four Google Doc tabs archived in `diagnostic-source.md`. Immutable versioned question/feedback data lives in `apps/web/src/features/diagnostic/server/exam.json`; never import this file into a client component.

## Deployment

- Run `npm run migrate:diagnostic` using the deployment database configuration before enabling the page. The migration creates only `diagnostic_attempts` and is idempotent.
- Run `npm run check:diagnostic` and `npm run lint:web`.
- With the local server running, `npm run check:diagnostic-api` checks the API lifecycle and deletes only its two random synthetic attempts.
- Audio is served through the existing Drive audio proxy. Both tracks must load before the timer can start.
- No automatic email delivery is claimed or configured. Results and the study plan are available on screen, by private bearer link, as a text download and through the browser's PDF print dialog.

## Integrity and persistence

45 minutes measured from PostgreSQL timestamps. Saves and submission use a row transaction and a 15-second editor lease. Refresh preserves a per-tab editor ID; browser locks protect duplicated tabs. A submitted attempt is immutable. Expired requests only grade answers already saved before the deadline. Expired attempts are finalized on the next heartbeat or resume; a closed browser cannot extend its deadline. Each row contains its own exam snapshot so later edits do not change historical grading.

The browser keeps an offline draft and warns about pending synchronization. No score/answer keys are included in the public paper response. Results links contain a cryptographically random secret in a URL fragment; possession grants access, so they must be treated as private.

## Feedback and plan

16 fixed threshold groups; Grammar combined-answer mistakes have option-specific feedback. Blanks are distinguished from wrong answers. Reading vocabulary is explicitly an inference from the Reading total. The plan has 24 sessions, prioritizes weaker groups, retains all three skills and supports 15/30/45/60 minutes daily. It uses source-backed exercises and advice, not generated external resource links. No IELTS band is inferred.
