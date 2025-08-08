import {
    actions,
    Empty,
    Frames,
    Logging,
    SyncConcept,
    Vars,
} from "./engine/mod.ts";

export class CounterConcept {
    public count = 0;
    increment(_: Empty) {
        this.count++;
        return {};
    }
    decrement(_: Empty) {
        this.count--;
        return {};
    }
    _getCount(_: {}): { count: number }[] {
        return [{ count: this.count }];
    }
}

export class ButtonConcept {
    clicked({ kind }: { kind: string }) {
        return { kind };
    }
}

export class NotificationConcept {
    notify({ message }: { message: string }) {
        console.log("Notification: ", message);
        return { message };
    }
}

// Create new Sync engine
const Sync = new SyncConcept();
Sync.logging = Logging.TRACE;

// Register concepts
const concepts = {
    Button: new ButtonConcept(),
    Counter: new CounterConcept(),
    Notification: new NotificationConcept(),
};

// All concepts must be instrumented to be reactive and used in a sync
const { Button, Counter, Notification } = Sync.instrument(concepts);

// Each sync is a function that returns a declarative synchronization
const ButtonIncrement = ({}: Vars) => ({
    when: actions(
        [Button.clicked, { kind: "increment_counter" }, {}],
    ),
    then: actions(
        [Counter.increment, {}],
    ),
});

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

// Register syncs by a unique name
const syncs = { ButtonIncrement, NotifyWhenReachTen };
Sync.register(syncs);

// Clicking the button 10 times will eventually trigger the notification
for (let i = 0; i < 11; i++) {
    await Button.clicked({ kind: "increment_counter" });
}
