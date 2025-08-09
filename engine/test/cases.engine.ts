import { actions, Frames, Logging, SyncConcept, Vars } from "../mod.ts";
import { assertEqual, setLogging, TestRunner } from "./helpers.ts";
import {
    ButtonConcept,
    CounterConcept,
    ListConcept,
    NotificationConcept,
    RecorderConcept,
} from "./mocks.ts";
import { makeSyncs } from "./syncs.ts";

export function registerEngineEdgeCases(runner: TestRunner) {
    runner.test("where frames filter prevents extra then actions", async () => {
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
        assertEqual(Notification.messages.length, 0);
        await Button.clicked({ kind: "inc" });
        assertEqual(Notification.messages.length, 1);
    });

    runner.test("multiple flows do not cross-match when clauses", async () => {
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

        // Two independent clicks should each be separate flows; ensure no accidental cross match
        await Button.clicked({ kind: "inc" });
        await Button.clicked({ kind: "inc" });
        await Button.clicked({ kind: "inc" });
        assertEqual(Notification.messages.length, 1);
    });

    runner.test("frames query fanout composes with subsequent where filters", async () => {
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

        // Extend: extra sync that only records even values
        const OnlyEven = ({ tag, value, evenTag }: Vars) => ({
            // leverage existing records created by FanoutOverList
            when: actions([Recorder.record, { tag }, {}]),
            where: (frames: Frames) =>
                frames
                    .filter(($) => String($[tag]).startsWith("v:"))
                    .map((frame) => {
                        const num = Number(
                            String(frame[tag]).split(":")[1] ?? "NaN",
                        );
                        return { ...frame, [value]: num } as typeof frame;
                    })
                    .filter(($) => (Number($[value]) % 2) === 0)
                    .map((frame) => ({
                        ...frame,
                        [evenTag]: `even:${String(frame[value])}`,
                    })),
            then: actions([Recorder.record, { tag: evenTag }]),
        });
        Sync.register({ OnlyEven });

        await Button.clicked({ kind: "fanout" });
        // original: 3 records; even filter should add exactly 1 more for value=2
        assertEqual(Recorder.order.filter((t) => t.startsWith("v:")).length, 3);
        assertEqual(
            Recorder.order.filter((t) => t.startsWith("even:")).length,
            1,
        );
    });
}
