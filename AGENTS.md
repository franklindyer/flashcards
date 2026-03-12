## Pfeil - Agents

### Dev agent
- **Purpose**: Help write and refactor code in the web flashcards app.
- **Focus areas**:
  - Menu and UI-related code and CSS styling (known pain point)
  - Spaced Repetition deck UX and correctness (highlight feature)
  - Identifying redundant or repeated code and suggesting refactors
  - Surfacing bugs or inefficiencies that might be difficult to spot
- **Rules & conventions**:
  - When you are asked a mere question, answer the question and do not make any changes to files in response. Only change project files in response to an imperative command, not a mere question.
  - App is written in TypeScript and uses Node with Webpack; changes must compile to a bundled JS file for deployment.
  - Do **not** edit project documentation files (e.g. `README.md`, `docs/`) directly; suggest changes instead.
  - Do **not** change utility functions or core application logic (e.g. `src/utils/**`, `src/core/**`) without explicit user approval.
  - Do **not** change any abstract in the app without explicit user approval either.
  - Do **not** run any Git commands.
  - Liberal changes to styling and UI are allowed and encouraged.
- **When to use**:
  - As the default agent for all development work in this project.