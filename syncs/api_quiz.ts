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
            API.request,
            { method: "GET", path: "/quizzes", owner },
            { request },
        ]),
        where: (frames: Frames) =>
            frames.query(Quiz._listForOwnerPayload, { owner }, { payload }),
        then: actions([API.response, {
            request,
            output: payload,
        }]),
    });

    const CreateQuiz = ({ owner, title, request }: Vars) => ({
        when: actions([
            API.request,
            { method: "POST", path: "/quizzes", owner, title },
            { request },
        ]),
        then: actions([Quiz.createQuiz, { owner, title }]),
    });

    const CreateQuizResponse = (
        { owner, title, quiz, request, payload }: Vars,
    ) => ({
        when: actions(
            [API.request, {
                method: "POST",
                path: "/quizzes",
                owner,
                title,
            }, { request }],
            [Quiz.createQuiz, { owner, title }, { quiz }],
        ),
        where: (frames: Frames) =>
            frames.map((frame) => ({
                ...frame,
                [payload]: { quiz: frame[quiz] as string },
            })),
        then: actions([API.response, {
            request,
            output: payload,
        }]),
    });

    const DeleteQuiz = ({ quiz, request }: Vars) => ({
        when: actions([API.request, {
            method: "DELETE",
            path: "/quizzes/:quiz",
            quiz,
        }, { request }]),
        then: actions([Quiz.deleteQuiz, { quiz }], [
            API.response,
            { request, output: { ok: true } },
        ]),
    });

    const GetQuiz = ({ quiz, payload, request }: Vars) => ({
        when: actions([API.request, {
            method: "GET",
            path: "/quizzes/:quiz",
            quiz,
        }, { request }]),
        where: (frames: Frames) =>
            frames.query(Quiz._collectQuizForApi, { quiz }, { payload }),
        then: actions([API.response, {
            request,
            output: payload,
        }]),
    });

    const AddQuestion = ({ quiz, text, request }: Vars) => ({
        when: actions([API.request, {
            method: "POST",
            path: "/quizzes/:quiz/questions",
            quiz,
            text,
        }, { request }]),
        then: actions([Quiz.addQuestion, { quiz, text }]),
    });

    const AddQuestionResponse = (
        { quiz, text, question, request, payload }: Vars,
    ) => ({
        when: actions(
            [API.request, {
                method: "POST",
                path: "/quizzes/:quiz/questions",
                quiz,
                text,
            }, { request }],
            [Quiz.addQuestion, { quiz, text }, { question }],
        ),
        where: (frames: Frames) =>
            frames.map((frame) => ({
                ...frame,
                [payload]: { question: frame[question] as string },
            })),
        then: actions([API.response, {
            request,
            output: payload,
        }]),
    });

    const RenameQuestion = ({ question, text, request }: Vars) => ({
        when: actions([API.request, {
            method: "PATCH",
            path: "/questions/:question",
            question,
            text,
        }, { request }]),
        then: actions([Quiz.renameQuestion, { question, text }], [
            API.response,
            { request, output: { ok: true } },
        ]),
    });

    const DeleteQuestion = ({ question, request }: Vars) => ({
        when: actions([API.request, {
            method: "DELETE",
            path: "/questions/:question",
            question,
        }, { request }]),
        then: actions([Quiz.deleteQuestion, { question }], [
            API.response,
            { request, output: { ok: true } },
        ]),
    });

    const AddOption = ({ question, label, request }: Vars) => ({
        when: actions([API.request, {
            method: "POST",
            path: "/questions/:question/options",
            question,
            label,
        }, { request }]),
        then: actions([Quiz.addOption, { question, label }]),
    });

    const AddOptionResponse = (
        { question, label, option, request, payload }: Vars,
    ) => ({
        when: actions(
            [API.request, {
                method: "POST",
                path: "/questions/:question/options",
                question,
                label,
            }, { request }],
            [Quiz.addOption, { question, label }, { option }],
        ),
        where: (frames: Frames) =>
            frames.map((frame) => ({
                ...frame,
                [payload]: { option: frame[option] as string },
            })),
        then: actions([API.response, {
            request,
            output: payload,
        }]),
    });

    const RenameOption = ({ option, label, request }: Vars) => ({
        when: actions([API.request, {
            method: "PATCH",
            path: "/options/:option",
            option,
            label,
        }, { request }]),
        then: actions([Quiz.renameOption, { option, label }], [
            API.response,
            { request, output: { ok: true } },
        ]),
    });

    const DeleteOption = ({ option, request }: Vars) => ({
        when: actions([API.request, {
            method: "DELETE",
            path: "/options/:option",
            option,
        }, { request }]),
        then: actions([Quiz.deleteOption, { option }], [
            API.response,
            { request, output: { ok: true } },
        ]),
    });

    const Activate = ({ question, request }: Vars) => ({
        when: actions([API.request, {
            method: "POST",
            path: "/questions/:question/activate",
            question,
        }, { request }]),
        then: actions([Activation.activate, { question }]),
    });

    const ActivateResponse = (
        { question, activation, request, payload }: Vars,
    ) => ({
        when: actions(
            [API.request, {
                method: "POST",
                path: "/questions/:question/activate",
                question,
            }, { request }],
            [Activation.activate, { question }, { activation }],
        ),
        where: (frames: Frames) =>
            frames.map((frame) => ({
                ...frame,
                [payload]: { activation: frame[activation] as string },
            })),
        then: actions([API.response, {
            request,
            output: payload,
        }]),
    });

    const Deactivate = ({ activation, request }: Vars) => ({
        when: actions([API.request, {
            method: "POST",
            path: "/activations/:activation/deactivate",
            activation,
        }, { request }]),
        then: actions([Activation.deactivate, { activation }], [
            API.response,
            { request, output: { ok: true } },
        ]),
    });

    const Show = ({ activation, request }: Vars) => ({
        when: actions([API.request, {
            method: "POST",
            path: "/activations/:activation/show",
            activation,
        }, { request }]),
        then: actions([Activation.show, { activation }], [
            API.response,
            { request, output: { ok: true } },
        ]),
    });

    const Hide = ({ activation, request }: Vars) => ({
        when: actions([API.request, {
            method: "POST",
            path: "/activations/:activation/hide",
            activation,
        }, { request }]),
        then: actions([Activation.hide, { activation }], [
            API.response,
            { request, output: { ok: true } },
        ]),
    });

    const Choose = ({ activation, user, option, request }: Vars) => ({
        when: actions([API.request, {
            method: "POST",
            path: "/activations/:activation/choose",
            activation,
            user,
            option,
        }, { request }]),
        then: actions(
            [Activation.choose, { activation, user, option }],
            [API.response, { request, output: { ok: true } }],
        ),
    });

    const GetActivation = (
        { activation, request, payload, question, showResults }: Vars,
    ) => ({
        when: actions([API.request, {
            method: "GET",
            path: "/activations/:activation",
            activation,
        }, { request }]),
        where: (frames: Frames) =>
            frames
                .query(Activation._getActivation, { activation }, {
                    question,
                    showResults,
                })
                .map((frame) => {
                    const q = Quiz._getQuestion({
                        question: frame[question] as string,
                    })[0];
                    const options = Quiz._getOptions({
                        question: frame[question] as string,
                    });
                    const counts = Activation._getVotes({
                        activation: frame[activation] as string,
                    });
                    const byOption = new Map(counts.map((c) => [c.option, c]));
                    const payloadValue = {
                        activation: frame[activation] as string,
                        quiz: q?.quiz,
                        question: {
                            question: frame[question] as string,
                            text: q?.text ?? "",
                        },
                        showResults: frame[showResults] as boolean,
                        options: options.map((o, idx) => ({
                            option: o.option,
                            label: o.label,
                            letter: String.fromCharCode(65 + idx),
                            count: byOption.get(o.option)?.count ?? 0,
                            total: byOption.get(o.option)?.total ??
                                (counts[0]?.total ?? 0),
                        })),
                    };
                    return {
                        ...frame,
                        [payload]: payloadValue,
                    } as typeof frame;
                }),
        then: actions([API.response, {
            request,
            output: payload,
        }]),
    });

    const GetDisplay = ({ quiz, request, payload }: Vars) => ({
        when: actions([
            API.request,
            { method: "GET", path: "/display/:quiz", quiz },
            { request },
        ]),
        where: (frames: Frames) =>
            frames.map((frame) => {
                const qid = frame[quiz] as string;
                const qinfo = Quiz._getQuiz({ quiz: qid })[0];
                if (!qinfo) return frame;
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
                return { ...frame, [payload]: payloadValue } as typeof frame;
            }),
        then: actions([API.response, {
            request,
            output: payload,
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
