## Sync Quizzie — a sample app for Concept Design

**What this is**: a tiny, end‑to‑end app that demonstrates building with
concepts and synchronizations (inspired by Daniel Jackson’s “The Essence of
Software”). Each concept is an independent module with a single purpose;
synchronizations declare how concept actions compose. This repo is a proof of
concept and a single large generation pass + refinement steps using Cursor,
using the prompt and images found in `quizzie_specs`, as a test of how far the
implementation gets. `prompt.md` shows the initial one-shot prompt that
scaffolded most of the application, with a few follow-ups patching
underspecified behavior not in the original prompt. See if you can fix bugs,
add/finish functionality, or get a basic sense for how things work!

### How it’s organized

```text
sync-quizzie/
├─ specs/           Concept specs (.concept) — source of truth for state/actions
├─ concepts/        Concept implementations (TS) — strictly independent modules
├─ syncs/           Synchronizations — declarative cross‑concept composition
├─ engine/          Minimal runtime for actions, flows, and sync logic
├─ web/             Static client served by the server
├─ server.ts        Express server + concept wiring (API, Quiz, Activation)
└─ package.json     Dev scripts (tsx)
```

- **Specs** drive **implementations**; **syncs** compose behavior across
  concepts.
- The server instruments concepts and registers syncs as the app entry point.

The server (`server.ts`) instruments three concepts — `API`, `Quiz`, and
`Activation` — and registers the syncs in `syncs/api_quiz.ts`. The `API` concept
plays the role of a bootstrap/entry point. The `User` concept is currently
non-functional and a placeholder.

### Shared Human + AI context

This project treats design as a shared context between humans and AI. You’re
encouraged to read the rules and design notes directly:

- `.cursor/rules` — living guidance for concept design and synchronization
  patterns
- `specs/*.concept` — the source of truth for state and action shapes

Keeping these artifacts close and plain‑text is intended to help both humans and
AI reason about the same model, and keeps edits small, explicit, and reviewable.

### Quickstart

Requirements: Node 18+

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

API routes are proxied through the `API` concept (see `server.ts`). Explore or
modify behaviors by editing concept specs/implementations and the syncs that
connect them.

### For testers

- **Status**: Experimental. APIs, sync shapes, and ergonomics may change.
- **Things to try**:
  - **Fix bugs / note issues** you notice while using the web demo
  - **Enrich `.cursor/rules`** with clarified patterns or anti‑patterns you find
  - **Add extensions**: e.g., an `Auth` concept (registration/login)
  - **Persistence**: swap the in‑memory state for a lightweight store, such as
    MongoDB. You should be able to modify concept implementations completely
    independently and freely swap databases without affecting any other code.
  - **New framework**: start over by keeping just `engine` and the `.cursor` -
    you can use any web framework or approach that you'd like. This repo was
    generated with a prompt that did not specify a particular approach - maybe a
    specific framework can do better!

### Logging

If you'd like to delve a little under the hood, the engine allows for different
levels of logging of actions. After initializing an engine, simply set:

```
const Sync = new SyncConcept();
Sync.logging = Logging.TRACE; // options are OFF, TRACE, and VERBOSE
```

`TRACE` gives a simple summary of every action that happened along with their
inputs and outputs, while `VERBOSE` dives deep and gives a complete account of
provenance and the processing of each record, and which synchronizations
matched.

### Why this approach?

- **Single purpose units**: concepts isolate responsibilities and state
- **Declarative composition**: synchronizations make cross‑concept behavior
  explicit
- **Easier change**: local edits with clear flow; fewer hidden couplings

Enjoy exploring, and start by reading
[`concept-design.mdc`](.cursor/rules/concept-design.mdc) under `.cursor/rules`,
and skimming `specs/`, `concepts/`, and `syncs/`.
