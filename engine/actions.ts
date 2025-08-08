import { uuid } from "./util.ts";
export interface ActionRecord {
    id?: string;
    action: Function;
    concept: object;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    synced?: Map<string, string>;
    flow: string;
}
export class ActionConcept {
    actions: Map<string, ActionRecord> = new Map();
    flowIndex: Map<string, ActionRecord[]> = new Map();
    invoke(record: ActionRecord) {
        let id = record.id;
        const flow = record.flow;
        if (id === undefined) {
            id = uuid();
        }
        const actionRecord = { id, ...record };
        this.actions.set(id, actionRecord);
        const partition = this.flowIndex.get(flow) || [];
        this.flowIndex.set(flow, [...partition, actionRecord]);
        // console.log("Invoke:", actionRecord);
        return { id };
    }
    invoked({ id, output }: { id: string; output: Record<string, unknown> }) {
        const action = this.actions.get(id);
        if (action === undefined) {
            throw new Error(`Action with id ${id} not found.`);
        }
        action.output = output;
        // console.log("Invoked:", output);
        return { id };
    }
    _getByFlow(flow: string) {
        return this.flowIndex.get(flow);
    }
    _getById(id: string) {
        return this.actions.get(id);
    }
}
