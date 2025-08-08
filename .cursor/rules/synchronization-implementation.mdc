---
alwaysApply: true
---

## Implementing Synchronizations

Instead of relying on a custom synchronization language and parser, the current
engine provides a TypeScript-native approach to specifying synchronizations. A
complete and functional example of this can be found in:

@example.ts

After creating concept classes, you can initialize the Sync engine and
instrument concepts as follows:

```
// Create new Sync engine
const Sync = new SyncConcept();

// Register concepts
const concepts = {
    Button: new ButtonConcept(),
    Counter: new CounterConcept(),
    Notification: new NotificationConcept(),
};

// All concepts must be instrumented to be reactive and used in a sync
const { Button, Counter, Notification } = Sync.instrument(concepts);
```

The original, unmodified concepts are available as (e.g.) `concepts.Button`,
while the destructuring allows for the instrumented version `Button` to both
participate in syncs, as well as feature as a fully reactive concept. Calling
`Button.clicked({ kind: "increment_counter" })`, for example, will trigger all
registered synchronizations.

The synchronizations shown previously in the specification language can be
written in TypeScript as follows:

```
// Each sync is a function that returns a declarative synchronization
const ButtonIncrement = ({}: Vars) => ({
    when: actions(
        [Button.clicked, { kind: "increment_counter" }, {}],
    ),
    then: actions(
        [Counter.increment, {}],
    ),
});
```

Each synchronization is a simple function that returns an object with the
appropriate keys, minimally containing `when` and `then`. The `actions` helper
function enables a shorthand specification of action patterns as an array, where
the first argument is the instrumented action, the second the input pattern, and
in the case of the `when` clause, the third is the output pattern.
Synchronizations may additionally have a `where` clause and specify variables:

```
// Each sync can declare the used variables by destructuring the input vars object
const NotifyWhenReachTen = ({ count }: Vars) => ({
    when: actions(
        [Button.clicked, { kind: "increment_counter" }, {}],
        [Counter.increment, {}, {}],
    ),
    where: (frames: Frames): Frames => {
        return frames
            .query(Counter._getCount, {}, { count })
            .filter(($) => {
                return $[count] > 10;
            });
    },
    then: actions(
        [Notification.notify, { message: "Reached 10" }],
    ),
});
```

Each synchronization function actually receives a special object that you can
destructure arbitrarily to receive variables to use in your patterns. In this
case, we destructure `count` to use it as a variable, which can be employed on
the right-hand side of input/output patterns to indicate an open binding. The
`where` clause, unlike the other two, is itself also a function that simply
takes in a set of `Frames` and returns a set of `Frames`. This refers to the
idea that each `Frame` is a `Record<symbol, unknown>` describing the current
bindings of the current frame, where each `Frame` that makes it through to the
`then` clause corresponds 1-to-1 with calling all actions in the `then` with
those bindings.

`Frames` is simply a small extension of the `Array` class, and all of the
standard methods and iterator functions can be applied to it. It additionally
carries the `.query` method which enables query functions on concepts to receive
certain inputs and produce outputs that enrich the frame. In this basic `where`
clause it enhances every frame with a `count` binding. In a slightly more
advanced example, something like:

```
.query(Comment._getByTarget, {target: post}, {comment})
```

says to lookup the `post` binding for the frame, and query the `Comment` concept
for all comments associated with a `target` of that `post`. Note that post as a
variable refers to that unique symbol for binding, and that the role of the
input pattern is simply to match our current binding name to the generic
accepted parameter name of `Comment._getByTarget`: since concepts are highly
modular, we encourage general names like `target` to enable commenting on many
kinds of things, and this pattern provides the way to map the two names. In this
case we are okay with binding the `comment` output with a symbol of the same
name, and use JavaScript's destructuring shorthand to indicate this. For such a
pattern, we would expect there to be at least `({post, comment, ...}: Vars)` as
the input signature for the containing synchronization function.

All such query functions always return an array of such frames, specifically to
allow for this kind of behavior: imagine the containing synchronization was to
delete all comments associated with a specific post when that post is deleted.
Despite one frame and a single `post` binding coming in from the `when`, this
query would enable exactly as many frames, one each with a different `comment`
id bound, to execute in the `then` and cascade all the deletes, without manually
writing a `for` loop or other looping construct.

Finally, we can register syncs simply with:

```
const syncs = { ButtonIncrement, NotifyWhenReachTen };
Sync.register(syncs);
```

where the keys (having the same name in this case as their declaration) are the
unique keys used to register them in the engine. To utilize the engine and
import the minimal amount of types needed to specify each piece, you can use the
following import:

```
import {
    actions,
    Frames,
    SyncConcept,
    Vars,
} from "./engine/mod.ts";
```
