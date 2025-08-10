/*
  Copyright (c) Eagon Meng, MIT CSAIL. All rights reserved.
  SPDX-License-Identifier: CC-BY-NC-SA-4.0
  Licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International.
  See https://creativecommons.org/licenses/by-nc-sa/4.0/
*/
import { $vars } from "./vars.ts";
import { inspect, uuid } from "./util.ts";
import { ActionConcept, ActionRecord } from "./actions.ts";
import { Frames } from "./frames.ts";
import {
    ActionList,
    ActionPattern,
    Frame,
    InstrumentedAction,
    SyncFunctionMap,
    Synchronization,
} from "./types.ts";

// Unique symbols to associate with frames
const flow = Symbol("flow");
const synced = Symbol("synced");
const actionId = Symbol("actionId");

// Helper function to format action patterns
export function actions(
    ...actions: ActionList[]
): ActionPattern[] {
    return actions.map(([action, input, output]) => {
        const concept = action.concept;
        if (concept === undefined) {
            throw new Error(`Action ${action.name} is not instrumented.`);
        }
        return {
            concept,
            action,
            input,
            flow,
            ...(output ? { output } : {}),
        };
    });
}

type ActionArguments = Record<string | symbol, unknown>;

export enum Logging {
    OFF,
    TRACE,
    VERBOSE,
}

export class SyncConcept {
    public syncs: Record<string, Synchronization> = {};
    public syncsByAction: Map<InstrumentedAction, Set<Synchronization>> =
        new Map();
    public Action;
    public logging = Logging.TRACE;
    public boundActions: Map<Function, InstrumentedAction> = new Map();
    constructor(actionConcept: ActionConcept = new ActionConcept()) {
        this.Action = actionConcept;
    }
    register(syncs: SyncFunctionMap) {
        for (const [name, syncFunction] of Object.entries(syncs)) {
            const syncDeclaration = syncFunction($vars);
            const sync = { sync: name, ...syncDeclaration };
            this.syncs[name] = sync;
            // Index each sync by all actions in the `when`
            for (const { action } of sync.when) {
                const mappedSyncs = this.syncsByAction.get(action);
                if (mappedSyncs === undefined) {
                    this.syncsByAction.set(action, new Set([sync]));
                } else {
                    mappedSyncs.add(sync);
                }
            }
        }
    }
    async synchronize(record: ActionRecord) {
        if (this.logging === Logging.VERBOSE) {
            console.log("Synchronizing action:", record);
        }
        if (this.logging === Logging.TRACE) {
            const boundAction = (record.action as InstrumentedAction).action;
            const boundName = boundAction
                ? boundAction.name.slice("bound ".length)
                : "UNDEFINED";
            console.log(
                `${record.concept.constructor.name}.${boundName} ${
                    inspect(record.input)
                } => ${inspect(record.output)}\n`,
            );
        }
        const syncs = await this.syncsByAction.get(record.action);
        if (syncs) {
            for (const sync of syncs) {
                let [frames, actionSymbols] = await this.matchWhen(
                    record,
                    sync,
                );
                this.logFrames(
                    `Matched \`sync\`: ${sync.sync} with \`when\`:`,
                    frames,
                );
                if (sync.where !== undefined) {
                    const maybeFrames = sync.where(frames);
                    frames = maybeFrames instanceof Promise
                        ? await maybeFrames
                        : maybeFrames;
                    this.logFrames("After processing \`where\`:", frames);
                }
                await this.addThen(frames, sync, actionSymbols);
            }
        }
    }
    logFrames(message: string, frames: Frames) {
        if (this.logging === Logging.VERBOSE && frames.length > 0) {
            console.log(message, frames);
        }
    }
    async matchWhen(
        record: ActionRecord,
        sync: Synchronization,
    ): Promise<[Frames<Frame>, symbol[]]> {
        let frames = new Frames();
        const whens = sync.when;
        const flowActions = await this.Action._getByFlow(record.flow);
        if (flowActions === undefined) return [frames, []];
        let i = 0;
        const actionSymbols: symbol[] = [];
        frames.push({ [flow]: record.flow });
        for (const when of whens) {
            const actionSymbol = Symbol(`action_${i}`);
            actionSymbols.push(actionSymbol);
            i++;
            // Find all action record matches for single when
            const newFrames = new Frames();
            for (const frame of frames) {
                for (const record of flowActions) {
                    // Skip records that have been synced by current sync
                    if (record.synced && record.synced.has(sync.sync)) {
                        continue;
                    }
                    const matched = this.matchArguments(
                        record,
                        when,
                        frame,
                        actionSymbol,
                    );
                    if (matched === undefined) continue;
                    newFrames.push(matched);
                }
            }
            frames = newFrames;
        }
        return [frames, actionSymbols];
    }
    async addThen(
        frames: Frames,
        sync: Synchronization,
        actionSymbols: symbol[],
    ) {
        const thens: [InstrumentedAction, ActionArguments][] = [];
        for (const frame of frames) {
            // Collect when actions for marking after executing thens
            const whenActions: ActionRecord[] = [];
            for (const actionSymbol of actionSymbols) {
                const actionId = frame[actionSymbol];
                if (actionId === undefined || typeof actionId !== "string") {
                    throw new Error("Missing actionId in `then` clause.");
                }
                const action = this.Action._getById(actionId);
                if (action?.synced) {
                    whenActions.push(action);
                } else {
                    throw new Error(
                        `Action ${action} missing or missing synced Map.`,
                    );
                }
            }
            for (const then of sync.then) {
                const matched = this.matchThen(then, frame);
                const id = matched[actionId];

                if (id === undefined || typeof id !== "string") {
                    throw new Error(
                        "Action produced from \`then\` is missing an id.",
                    );
                }
                for (const whenAction of whenActions) {
                    whenAction.synced?.set(sync.sync, id);
                }
                thens.push([then.action, matched]);
            }
        }
        // Await all actions
        for (const [thenAction, thenRecord] of thens) {
            if (this.logging === Logging.VERBOSE) {
                console.log(`${sync.sync}: THEN ${thenAction}`, thenRecord);
            }
            await thenAction(thenRecord);
        }
    }
    matchThen(then: ActionPattern, frame: Frame) {
        const bound = Object.entries(then.input).map(([key, value]) => {
            let matchedValue = value;
            if (typeof value === "symbol") {
                matchedValue = frame[value];
                if (matchedValue === undefined) {
                    throw new Error(
                        `Missing binding: ${String(value)} in frame: ${frame}`,
                    );
                }
            }
            return [key, matchedValue];
        });
        const inputPattern = Object.fromEntries(bound);
        const input = {
            ...inputPattern,
            [flow]: frame[flow],
            [actionId]: uuid(),
        };
        return input as ActionArguments;
    }
    matchArguments(
        record: ActionRecord,
        when: ActionPattern,
        frame: Frame,
        actionSymbol: symbol,
    ) {
        let newFrame = { ...frame };
        // Match concept and action -> TODO: Support variable concept/action
        if (
            record.concept !== when.concept ||
            record.action !== when.action
        ) return;
        for (const [key, value] of Object.entries(when.input)) {
            const recordValue = record.input[key];
            if (recordValue === undefined) return;
            if (typeof value === "symbol") {
                const bound = frame[value];
                if (bound === undefined) {
                    newFrame = { ...newFrame, [value]: recordValue };
                } else {
                    if (bound !== recordValue) return;
                }
            } else {
                if (recordValue !== value) return;
            }
        }
        if (when.output === undefined) {
            throw new Error(`When pattern: ${when} is missing output pattern.`);
        }
        for (const [key, value] of Object.entries(when.output)) {
            if (record.output === undefined) return;
            const recordValue = record.output[key];
            if (recordValue === undefined) return;
            if (typeof value === "symbol") {
                const bound = frame[value];
                if (bound === undefined) {
                    newFrame = { ...newFrame, [value]: recordValue };
                } else {
                    if (bound !== recordValue) return;
                }
            } else {
                if (recordValue !== value) return;
            }
        }
        return { ...newFrame, [actionSymbol]: record.id };
    }

    instrumentConcept<T extends object>(concept: T) {
        const Action = this.Action;
        const synchronize = this.synchronize.bind(this);
        const boundActions = this.boundActions;
        return new Proxy(concept, {
            get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);
                // Bind queries (starts with "_") without instrumenting
                if (
                    typeof value === "function" && value.name.startsWith("_")
                ) {
                    let bound = boundActions.get(value);
                    if (bound === undefined) {
                        bound = value.bind(concept);
                        if (bound === undefined) {
                            throw new Error(`Action ${value} not found.`);
                        }
                        boundActions.set(value, bound);
                    }
                    return bound;
                }
                if (
                    typeof value === "function" && !value.name.startsWith("_")
                ) {
                    // action.actionName = value.name
                    let instrumented = boundActions.get(value);
                    if (instrumented === undefined) {
                        const action = value.bind(concept);
                        instrumented = async function instrumented(
                            args: ActionArguments,
                        ) {
                            let {
                                [flow]: flowToken,
                                [synced]: syncedMap,
                                [actionId]: id,
                                ...input
                            } = args;
                            if (flowToken === undefined) {
                                flowToken = uuid();
                            }
                            if (typeof flowToken !== "string") {
                                throw new Error("Flow token not string.");
                            }
                            if (syncedMap === undefined) {
                                syncedMap = new Map();
                            }
                            if (!(syncedMap instanceof Map)) {
                                throw new Error("synced must be a Map.");
                            }
                            if (id === undefined) id = uuid();
                            if (typeof id !== "string") {
                                throw new Error("actionId not string.");
                            }
                            const actionRecord = {
                                id,
                                action: instrumented,
                                concept,
                                input,
                                synced: syncedMap,
                                flow: flowToken,
                            };

                            Action.invoke(actionRecord);
                            const output = await action(input);
                            Action.invoked({ id, output });
                            await synchronize({ ...actionRecord, output });
                            return output;
                        };
                        instrumented.concept = concept;
                        instrumented.action = action;
                        const instrumentedRepr = () => `${inspect(action)}`;
                        instrumented.toString = instrumentedRepr;
                        Object.defineProperty(instrumented, inspect.custom, {
                            value: instrumentedRepr,
                            writable: false,
                            configurable: true,
                        });
                        boundActions.set(value, instrumented);
                    }
                    return instrumented as InstrumentedAction;
                }
                return value;
            },
        });
    }
    instrument<T extends Record<string, object>>(concepts: T): T {
        return Object.fromEntries(
            Object.entries(concepts).map(([key, concept]) => [
                key,
                this.instrumentConcept(concept),
            ]),
        ) as T;
    }
}
