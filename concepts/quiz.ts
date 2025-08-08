import { uuid } from "../engine/util.ts";

export interface QuizRecord {
    quiz: string;
    owner: string;
    title: string;
}
export interface QuestionRecord {
    question: string;
    quiz: string;
    text: string;
}
export interface OptionRecord {
    option: string;
    question: string;
    label: string;
}

export class QuizConcept {
    quizzes: Map<string, QuizRecord> = new Map();
    questions: Map<string, QuestionRecord> = new Map();
    options: Map<string, OptionRecord> = new Map();
    byOwner: Map<string, Set<string>> = new Map();
    byQuizQuestions: Map<string, Set<string>> = new Map();
    byQuestionOptions: Map<string, Set<string>> = new Map();

    createQuiz(
        { quiz, owner, title }: { quiz?: string; owner: string; title: string },
    ): { quiz: string } {
        const id = quiz ?? uuid();
        this.quizzes.set(id, { quiz: id, owner, title });
        if (!this.byOwner.has(owner)) this.byOwner.set(owner, new Set());
        this.byOwner.get(owner)!.add(id);
        return { quiz: id };
    }

    deleteQuiz({ quiz }: { quiz: string }): { quiz: string } {
        const record = this.quizzes.get(quiz);
        if (record) {
            const qset = this.byQuizQuestions.get(quiz) ?? new Set();
            for (const qid of qset) this.deleteQuestion({ question: qid });
            this.byOwner.get(record.owner)?.delete(quiz);
            this.quizzes.delete(quiz);
        }
        return { quiz };
    }

    addQuestion(
        { question, quiz, text }: {
            question?: string;
            quiz: string;
            text: string;
        },
    ): { question: string } {
        const id = question ?? uuid();
        this.questions.set(id, { question: id, quiz, text });
        if (!this.byQuizQuestions.has(quiz)) {
            this.byQuizQuestions.set(quiz, new Set());
        }
        this.byQuizQuestions.get(quiz)!.add(id);
        return { question: id };
    }

    deleteQuestion({ question }: { question: string }): { question: string } {
        const record = this.questions.get(question);
        if (record) {
            const oset = this.byQuestionOptions.get(question) ?? new Set();
            for (const oid of oset) this.deleteOption({ option: oid });
            this.byQuizQuestions.get(record.quiz)?.delete(question);
            this.questions.delete(question);
        }
        return { question };
    }

    renameQuestion(
        { question, text }: { question: string; text: string },
    ): { question: string } {
        const record = this.questions.get(question);
        if (record) record.text = text;
        return { question };
    }

    addOption(
        { option, question, label }: {
            option?: string;
            question: string;
            label: string;
        },
    ): { option: string } {
        const id = option ?? uuid();
        this.options.set(id, { option: id, question, label });
        if (!this.byQuestionOptions.has(question)) {
            this.byQuestionOptions.set(question, new Set());
        }
        this.byQuestionOptions.get(question)!.add(id);
        return { option: id };
    }

    deleteOption({ option }: { option: string }): { option: string } {
        const record = this.options.get(option);
        if (record) {
            this.byQuestionOptions.get(record.question)?.delete(option);
            this.options.delete(option);
        }
        return { option };
    }

    renameOption(
        { option, label }: { option: string; label: string },
    ): { option: string } {
        const record = this.options.get(option);
        if (record) record.label = label;
        return { option };
    }

    // Queries and data aggregations
    _getQuizzesByOwner(
        { owner }: { owner: string },
    ): { quiz: string; title: string }[] {
        const ids = this.byOwner.get(owner) ?? new Set();
        return [...ids].map((id) => {
            const q = this.quizzes.get(id)!;
            return { quiz: q.quiz, title: q.title };
        });
    }

    _getQuiz(
        { quiz }: { quiz: string },
    ): { quiz: string; owner: string; title: string }[] {
        const q = this.quizzes.get(quiz);
        return q ? [{ quiz: q.quiz, owner: q.owner, title: q.title }] : [];
    }

    _getQuestions(
        { quiz }: { quiz: string },
    ): { question: string; text: string }[] {
        const ids = this.byQuizQuestions.get(quiz) ?? new Set();
        return [...ids].map((id) => {
            const s = this.questions.get(id)!;
            return { question: s.question, text: s.text };
        });
    }

    _getOptions(
        { question }: { question: string },
    ): { option: string; label: string }[] {
        const ids = this.byQuestionOptions.get(question) ?? new Set();
        return [...ids].map((id) => {
            const o = this.options.get(id)!;
            return { option: o.option, label: o.label };
        });
    }

    _getQuestion(
        { question }: { question: string },
    ): { question: string; text: string; quiz: string }[] {
        const qs = this.questions.get(question);
        return qs
            ? [{ question: qs.question, text: qs.text, quiz: qs.quiz }]
            : [];
    }

    // Helper for API responses that need nested data
    _collectQuizForApi({ quiz }: { quiz: string }): { payload: unknown }[] {
        const q = this.quizzes.get(quiz);
        if (!q) return [];
        const questions = [...(this.byQuizQuestions.get(quiz) ?? new Set())]
            .map((qid) => {
                const qs = this.questions.get(qid)!;
                const options = [
                    ...(this.byQuestionOptions.get(qid) ?? new Set()),
                ].map((oid) => this.options.get(oid)!);
                return {
                    question: qs.question,
                    text: qs.text,
                    options: options.map((o) => ({
                        option: o.option,
                        label: o.label,
                    })),
                };
            });
        return [{
            payload: {
                quiz: q.quiz,
                title: q.title,
                owner: q.owner,
                questions,
            },
        }];
    }

    _listForOwnerPayload({ owner }: { owner: string }): { payload: unknown }[] {
        const quizzes = this._getQuizzesByOwner({ owner });
        return [{ payload: quizzes }];
    }
}
