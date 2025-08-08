import { uuid } from "../engine/util.ts";

export interface ActivationRecord {
    activation: string;
    question: string;
    isActive: boolean;
    showResults: boolean;
}
export interface VoteRecord {
    activation: string;
    user: string;
    option: string;
}

export class ActivationConcept {
    activations: Map<string, ActivationRecord> = new Map();
    votesByActivation: Map<string, Map<string, string>> = new Map(); // activation -> user -> option
    byQuestion: Map<string, Set<string>> = new Map();

    activate(
        { activation, question }: { activation?: string; question: string },
    ): { activation: string } {
        const id = activation ?? uuid();
        const record: ActivationRecord = {
            activation: id,
            question,
            isActive: true,
            showResults: false,
        };
        this.activations.set(id, record);
        if (!this.byQuestion.has(question)) {
            this.byQuestion.set(question, new Set());
        }
        this.byQuestion.get(question)!.add(id);
        return { activation: id };
    }

    deactivate({ activation }: { activation: string }): { activation: string } {
        const rec = this.activations.get(activation);
        if (rec) rec.isActive = false;
        return { activation };
    }

    show({ activation }: { activation: string }): { activation: string } {
        const rec = this.activations.get(activation);
        if (rec) rec.showResults = true;
        return { activation };
    }

    hide({ activation }: { activation: string }): { activation: string } {
        const rec = this.activations.get(activation);
        if (rec) rec.showResults = false;
        return { activation };
    }

    choose(
        { activation, user, option }: {
            activation: string;
            user: string;
            option: string;
        },
    ): { activation: string } {
        if (!this.votesByActivation.has(activation)) {
            this.votesByActivation.set(activation, new Map());
        }
        this.votesByActivation.get(activation)!.set(user, option);
        return { activation };
    }

    _getByQuestion(
        { question }: { question: string },
    ): { activation: string; isActive: boolean; showResults: boolean }[] {
        const ids = this.byQuestion.get(question) ?? new Set();
        return [...ids].map((id) => {
            const a = this.activations.get(id)!;
            return {
                activation: a.activation,
                isActive: a.isActive,
                showResults: a.showResults,
            };
        });
    }

    _getVotes(
        { activation }: { activation: string },
    ): { option: string; count: number; total: number }[] {
        const map = this.votesByActivation.get(activation) ?? new Map();
        const total = map.size;
        const counts: Map<string, number> = new Map();
        for (const option of map.values()) {
            counts.set(option, (counts.get(option) ?? 0) + 1);
        }
        const result: { option: string; count: number; total: number }[] = [];
        for (const [option, count] of counts.entries()) {
            result.push({ option, count, total });
        }
        return result;
    }

    _getUserVote(
        { activation, user }: { activation: string; user: string },
    ): { option: string }[] {
        const opt = this.votesByActivation.get(activation)?.get(user);
        return opt ? [{ option: opt }] : [];
    }

    _getActivation(
        { activation }: { activation: string },
    ): {
        activation: string;
        question: string;
        isActive: boolean;
        showResults: boolean;
    }[] {
        const rec = this.activations.get(activation);
        return rec ? [{ ...rec }] : [];
    }
}

