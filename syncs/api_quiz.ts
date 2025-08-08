import { actions, Frames, Vars } from "../engine/mod.ts";
import { APIConcept } from "../concepts/api.ts";
import { QuizConcept } from "../concepts/quiz.ts";
import { ActivationConcept } from "../concepts/activation.ts";

// This file defines synchronizations between generic API requests and quiz behavior

export function makeApiQuizSyncs(
    API: APIConcept,
    Quiz: QuizConcept,
    Activation: ActivationConcept,
) {
    // GET /quizzes
    const ListQuizzes = ({ owner, request, payload }: Vars) => ({
        when: actions([
            API.request as any,
            { method: "GET", path: "/quizzes", owner },
            { request },
        ]),
        where: (frames: Frames) => {
            const result = new Frames();
            for (const frame of frames) {
                const quizzes = Quiz._getQuizzesByOwner({
                    owner: (frame as any)[owner],
                });
                result.push({ ...(frame as any), [payload]: quizzes } as any);
            }
            return result;
        },
        then: actions([API.response as any, {
            request,
            output: (payload as unknown) as symbol,
        }]),
    });

    const CreateQuiz = ({ owner, title, request }: Vars) => ({
        when: actions([
            API.request as any,
            { method: "POST", path: "/quizzes", owner, title },
            { request },
        ]),
        then: actions([Quiz.createQuiz as any, { owner, title }]),
    });

    const CreateQuizResponse = (
        { owner, title, quiz, request, payload }: Vars,
    ) => ({
        when: actions(
            [API.request as any, {
                method: "POST",
                path: "/quizzes",
                owner,
                title,
            }, { request }],
            [Quiz.createQuiz as any, { owner, title }, { quiz }],
        ),
        where: (frames: Frames) => {
            const result = new Frames();
            for (const frame of frames) {
                result.push(
                    {
                        ...(frame as any),
                        [payload]: { quiz: (frame as any)[quiz] },
                    } as any,
                );
            }
            return result;
        },
        then: actions([API.response as any, {
            request,
            output: (payload as unknown) as symbol,
        }]),
    });

    const DeleteQuiz = ({ quiz, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "DELETE",
            path: "/quizzes/:quiz",
            quiz,
        }, { request }]),
        then: actions([Quiz.deleteQuiz as any, { quiz }], [
            API.response as any,
            { request, output: { ok: true } as any },
        ]),
    });

    const GetQuiz = ({ quiz, payload, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "GET",
            path: "/quizzes/:quiz",
            quiz,
        }, { request }]),
        where: (frames: Frames) =>
            frames.query(Quiz._collectQuizForApi as any, { quiz }, { payload }),
        then: actions([API.response as any, {
            request,
            output: (payload as unknown) as symbol,
        }]),
    });

    const AddQuestion = ({ quiz, text, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "POST",
            path: "/quizzes/:quiz/questions",
            quiz,
            text,
        }, { request }]),
        then: actions([Quiz.addQuestion as any, { quiz, text }]),
    });

    const AddQuestionResponse = (
        { quiz, text, question, request, payload }: Vars,
    ) => ({
        when: actions(
            [API.request as any, {
                method: "POST",
                path: "/quizzes/:quiz/questions",
                quiz,
                text,
            }, { request }],
            [Quiz.addQuestion as any, { quiz, text }, { question }],
        ),
        where: (frames: Frames) => {
            const result = new Frames();
            for (const frame of frames) {
                result.push(
                    {
                        ...(frame as any),
                        [payload]: { question: (frame as any)[question] },
                    } as any,
                );
            }
            return result;
        },
        then: actions([API.response as any, {
            request,
            output: (payload as unknown) as symbol,
        }]),
    });

    const RenameQuestion = ({ question, text, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "PATCH",
            path: "/questions/:question",
            question,
            text,
        }, { request }]),
        then: actions([Quiz.renameQuestion as any, { question, text }], [
            API.response as any,
            { request, output: { ok: true } as any },
        ]),
    });

    const DeleteQuestion = ({ question, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "DELETE",
            path: "/questions/:question",
            question,
        }, { request }]),
        then: actions([Quiz.deleteQuestion as any, { question }], [
            API.response as any,
            { request, output: { ok: true } as any },
        ]),
    });

    const AddOption = ({ question, label, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "POST",
            path: "/questions/:question/options",
            question,
            label,
        }, { request }]),
        then: actions([Quiz.addOption as any, { question, label }]),
    });

    const AddOptionResponse = (
        { question, label, option, request, payload }: Vars,
    ) => ({
        when: actions(
            [API.request as any, {
                method: "POST",
                path: "/questions/:question/options",
                question,
                label,
            }, { request }],
            [Quiz.addOption as any, { question, label }, { option }],
        ),
        where: (frames: Frames) => {
            const result = new Frames();
            for (const frame of frames) {
                result.push(
                    {
                        ...(frame as any),
                        [payload]: { option: (frame as any)[option] },
                    } as any,
                );
            }
            return result;
        },
        then: actions([API.response as any, {
            request,
            output: (payload as unknown) as symbol,
        }]),
    });

    const RenameOption = ({ option, label, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "PATCH",
            path: "/options/:option",
            option,
            label,
        }, { request }]),
        then: actions([Quiz.renameOption as any, { option, label }], [
            API.response as any,
            { request, output: { ok: true } as any },
        ]),
    });

    const DeleteOption = ({ option, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "DELETE",
            path: "/options/:option",
            option,
        }, { request }]),
        then: actions([Quiz.deleteOption as any, { option }], [
            API.response as any,
            { request, output: { ok: true } as any },
        ]),
    });

    const Activate = ({ question, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "POST",
            path: "/questions/:question/activate",
            question,
        }, { request }]),
        then: actions([Activation.activate as any, { question }]),
    });

    const ActivateResponse = (
        { question, activation, request, payload }: Vars,
    ) => ({
        when: actions(
            [API.request as any, {
                method: "POST",
                path: "/questions/:question/activate",
                question,
            }, { request }],
            [Activation.activate as any, { question }, { activation }],
        ),
        where: (frames: Frames) => {
            const result = new Frames();
            for (const frame of frames) {
                result.push(
                    {
                        ...(frame as any),
                        [payload]: { activation: (frame as any)[activation] },
                    } as any,
                );
            }
            return result;
        },
        then: actions([API.response as any, {
            request,
            output: (payload as unknown) as symbol,
        }]),
    });

    const Deactivate = ({ activation, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "POST",
            path: "/activations/:activation/deactivate",
            activation,
        }, { request }]),
        then: actions([Activation.deactivate as any, { activation }], [
            API.response as any,
            { request, output: { ok: true } as any },
        ]),
    });

    const Show = ({ activation, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "POST",
            path: "/activations/:activation/show",
            activation,
        }, { request }]),
        then: actions([Activation.show as any, { activation }], [
            API.response as any,
            { request, output: { ok: true } as any },
        ]),
    });

    const Hide = ({ activation, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "POST",
            path: "/activations/:activation/hide",
            activation,
        }, { request }]),
        then: actions([Activation.hide as any, { activation }], [
            API.response as any,
            { request, output: { ok: true } as any },
        ]),
    });

    const Choose = ({ activation, user, option, request }: Vars) => ({
        when: actions([API.request as any, {
            method: "POST",
            path: "/activations/:activation/choose",
            activation,
            user,
            option,
        }, { request }]),
        then: actions(
            [Activation.choose as any, { activation, user, option }],
            [API.response as any, { request, output: { ok: true } as any }],
        ),
    });

    const GetActivation = ({ activation, request, payload }: Vars) => ({
        when: actions([API.request as any, {
            method: "GET",
            path: "/activations/:activation",
            activation,
        }, { request }]),
        where: (frames: Frames) => {
            const result = new Frames();
            for (const frame of frames) {
                const a = Activation._getActivation({
                    activation: (frame as any)[activation],
                })[0];
                if (!a) continue;
                const question = a.question;
                const q = Quiz._getQuestion({ question })[0];
                const options = Quiz._getOptions({ question });
                const counts = Activation._getVotes({
                    activation: a.activation,
                });
                const byOption = new Map(counts.map((c) => [c.option, c]));
                const payloadValue = {
                    activation: a.activation,
                    quiz: q?.quiz,
                    question: { question, text: q?.text ?? "" },
                    showResults: a.showResults,
                    options: options.map((o, idx) => ({
                        option: o.option,
                        label: o.label,
                        letter: String.fromCharCode(65 + idx),
                        count: byOption.get(o.option)?.count ?? 0,
                        total: byOption.get(o.option)?.total ??
                            (counts[0]?.total ?? 0),
                    })),
                };
                result.push(
                    { ...(frame as any), [payload]: payloadValue } as any,
                );
            }
            return result;
        },
        then: actions([API.response as any, {
            request,
            output: (payload as unknown) as symbol,
        }]),
    });

    const GetDisplay = ({ quiz, request, payload }: Vars) => ({
        when: actions([
            API.request as any,
            { method: "GET", path: "/display/:quiz", quiz },
            { request },
        ]),
        where: (frames: Frames) => {
            const result = new Frames();
            for (const frame of frames) {
                const qid = (frame as any)[quiz];
                const qinfo = Quiz._getQuiz({ quiz: qid })[0];
                if (!qinfo) continue;
                const questions = Quiz._getQuestions({ quiz: qid });
                const payloadValue = {
                    quiz: qid,
                    title: qinfo.title,
                    questions: questions.map((qs) => {
                        const activations = Activation._getByQuestion({
                            question: qs.question,
                        });
                        const active = activations.find((a) => a.isActive);
                        const votes = active
                            ? Activation._getVotes({
                                activation: active.activation,
                            })
                            : [];
                        const byOption = new Map(
                            votes.map((v) => [v.option, v]),
                        );
                        const options = Quiz._getOptions({
                            question: qs.question,
                        }).map((op, idx) => ({
                            option: op.option,
                            label: op.label,
                            letter: String.fromCharCode(65 + idx),
                            count: byOption.get(op.option)?.count ?? 0,
                            total: byOption.get(op.option)?.total ??
                                (votes[0]?.total ?? 0),
                        }));
                        return {
                            question: qs.question,
                            text: qs.text,
                            activation: active?.activation,
                            showResults: active?.showResults ?? false,
                            options,
                        };
                    }),
                };
                result.push(
                    { ...(frame as any), [payload]: payloadValue } as any,
                );
            }
            return result;
        },
        then: actions([API.response as any, {
            request,
            output: (payload as unknown) as symbol,
        }]),
    });

    return {
        ListQuizzes,
        CreateQuiz,
        CreateQuizResponse,
        DeleteQuiz,
        GetQuiz,
        AddQuestion,
        AddQuestionResponse,
        RenameQuestion,
        DeleteQuestion,
        AddOption,
        AddOptionResponse,
        RenameOption,
        DeleteOption,
        Activate,
        ActivateResponse,
        Deactivate,
        Show,
        Hide,
        Choose,
        GetActivation,
        GetDisplay,
    } as const;
}
