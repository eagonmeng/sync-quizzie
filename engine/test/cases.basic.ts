import { Logging, SyncConcept } from "../mod.ts";
import { assertEqual, setLogging, TestRunner } from "./helpers.ts";
import {
    ButtonConcept,
    CounterConcept,
    ListConcept,
    NotificationConcept,
    RecorderConcept,
} from "./mocks.ts";
import { makeSyncs } from "./syncs.ts";

export function registerBasicCases(runner: TestRunner) {
    runner.test("button click increments counter once", async () => {
        const Sync = new SyncConcept();
        setLogging(Sync, Logging.TRACE);
        const concepts = {
            Button: new ButtonConcept(),
            Counter: new CounterConcept(),
            Notification: new NotificationConcept(),
            List: new ListConcept(),
            Recorder: new RecorderConcept(),
        };
        const { Button, Counter, Notification, List, Recorder } = Sync
            .instrument(concepts);
        const syncs = makeSyncs(Button, Counter, Notification, List, Recorder);
        Sync.register(syncs);

        await Button.clicked({ kind: "inc" });
        assertEqual(Counter.count, 1);
    });

    runner.test("notify when count reaches 3", async () => {
        const Sync = new SyncConcept();
        setLogging(Sync, Logging.TRACE);
        const concepts = {
            Button: new ButtonConcept(),
            Counter: new CounterConcept(),
            Notification: new NotificationConcept(),
            List: new ListConcept(),
            Recorder: new RecorderConcept(),
        };
        const { Button, Counter, Notification, List, Recorder } = Sync
            .instrument(concepts);
        const syncs = makeSyncs(Button, Counter, Notification, List, Recorder);
        Sync.register(syncs);

        await Button.clicked({ kind: "inc" });
        await Button.clicked({ kind: "inc" });
        await Button.clicked({ kind: "inc" });
        assertEqual(Notification.messages.length, 1);
        assertEqual(Notification.messages[0], "reached 3");
    });

    runner.test("fanout over list via query", async () => {
        const Sync = new SyncConcept();
        setLogging(Sync, Logging.TRACE);
        const concepts = {
            Button: new ButtonConcept(),
            Counter: new CounterConcept(),
            Notification: new NotificationConcept(),
            List: new ListConcept(),
            Recorder: new RecorderConcept(),
        };
        const { Button, Counter, Notification, List, Recorder } = Sync
            .instrument(concepts);
        const syncs = makeSyncs(Button, Counter, Notification, List, Recorder);
        Sync.register(syncs);

        List.add({ value: 1 });
        List.add({ value: 2 });
        List.add({ value: 3 });
        await Button.clicked({ kind: "fanout" });
        assertEqual(Recorder.order.length, 3);
    });

    runner.test("fanout over list via async query", async () => {
        const Sync = new SyncConcept();
        setLogging(Sync, Logging.TRACE);
        const concepts = {
            Button: new ButtonConcept(),
            Counter: new CounterConcept(),
            Notification: new NotificationConcept(),
            List: new ListConcept(),
            Recorder: new RecorderConcept(),
        };
        const { Button, Counter, Notification, List, Recorder } = Sync
            .instrument(concepts);
        const syncs = makeSyncs(Button, Counter, Notification, List, Recorder);
        Sync.register(syncs);

        List.add({ value: 1 });
        List.add({ value: 2 });
        List.add({ value: 3 });
        await Button.clicked({ kind: "fanout-async" });
        assertEqual(Recorder.order.length, 3);
    });

    runner.test("prevent double fire by synced marks across when actions", async () => {
        const Sync = new SyncConcept();
        setLogging(Sync, Logging.TRACE);
        const concepts = {
            Button: new ButtonConcept(),
            Counter: new CounterConcept(),
            Notification: new NotificationConcept(),
            List: new ListConcept(),
            Recorder: new RecorderConcept(),
        };
        const { Button, Counter, Notification, List, Recorder } = Sync
            .instrument(concepts);
        const syncs = makeSyncs(Button, Counter, Notification, List, Recorder);
        Sync.register(syncs);

        await Recorder.record({ tag: "x" });
        // ChainRecordA appends ":a", PreventDoubleFire then appends ":done"
        // Ensure syncs ran exactly once each
        assertEqual(Recorder.order.join(","), "x,x:a,x:done");
    });
}
