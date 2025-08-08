---
alwaysApply: true
---

## Debugging

The engine contains logging logic to help trace issues, and which action is
occuring with what inputs and outputs. After initializing an engine, simply set:

```
const Sync = new SyncConcept();
Sync.logging = Logging.TRACE; // options are OFF, TRACE, and VERBOSE
```

`TRACE` gives a simple summary of every action that happened along with their
inputs and outputs, while `VERBOSE` dives deep and gives a complete account of
provenance and the processing of each record, and which synchronizations
matched.

In general, the concept design architecture affords reasoning piecemeal about
the entire system, meaning that you should be able to test concepts
individually, test synchronizations independently, and the frontend on its own.
Use output logs from `TRACE` level logging to find out if actions are occurring
as expected or to debug synchronizations (you could build a small script or edit
the logging behavior to pipe this information in a better way), and level
`VERBOSE` when absolutely necessary and you might be convinced that there is
something wrong with the engine, or a very subtle bug in synchronization
formulation.
