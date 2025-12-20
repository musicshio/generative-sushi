'use client';

import { UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useMemo, useState } from 'react';
import { Sushi } from '@/components/sushi';

export default function Chat({
                                 id,
                                 initialMessages,
                             }: { id?: string | undefined; initialMessages?: UIMessage[] } = {}) {
    const [input, setInput] = useState('');
    const [pendingGenerate, setPendingGenerate] = useState(false);
    const [pendingRebuttal, setPendingRebuttal] = useState(false);
    const { messages, sendMessage, } = useChat({
        id,
        messages: initialMessages,
        transport: new DefaultChatTransport({
            api: '/api/chat',
            // only send the last message to the server:
            prepareSendMessagesRequest({ messages, id }) {
                return { body: { message: messages[messages.length - 1], id } };
            },
        }),
    });

    type JudgePart = Extract<UIMessage['parts'][number], { type: 'tool-judgeIsSushi' }>;

    const judgeParts: JudgePart[] = useMemo(
        () =>
            messages
                .flatMap(m => m.parts)
                .filter(
                    (part): part is JudgePart =>
                        part.type === 'tool-judgeIsSushi',
                ),
        [messages],
    );

    const lastPositiveJudge = useMemo(
        () =>
            judgeParts
                .filter(part => part.state === 'output-available' && part.output && part.output.isSushi)
                .pop(),
        [judgeParts],
    );

    const hasSushiOutput = useMemo(
        () =>
            messages.some(m =>
                m.parts.some(
                    part =>
                        part.type === 'tool-createSushi' &&
                        part.state === 'output-available' &&
                        part.output,
                ),
            ),
        [messages],
    );

    const extractMetadataFromText = (text: string) => {
        const toppingMatch = text.match(/Topping:\s*([^\n]+)/i);
        const baseMatch = text.match(/Base:\s*([^\n]+)/i);
        if (!toppingMatch && !baseMatch) return null;
        return {
            topping: toppingMatch?.[1]?.trim(),
            base: baseMatch?.[1]?.trim(),
        };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        const meta = extractMetadataFromText(input);
        sendMessage({ text: input, metadata: meta && messages.length === 0 ? meta : undefined });
        setInput('');
    };

    const handleRebuttal = async () => {
        setPendingRebuttal(true);
        const topping = lastPositiveJudge?.input?.topping ?? '';
        const base = lastPositiveJudge?.input?.base ?? '';
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    message: {
                        id: 'rebuttal-system',
                        role: 'user',
                        parts: [
                            {
                                type: 'text',
                                text: `以下の判定に反論する文章を、創作寿司を肯定する立場で短く書いてください。\nTopping: ${topping}\nBase: ${base}`,
                            },
                        ],
                    },
                }),
            });

            const text = await res.text();
            // naive parse: take last chunk after "data: "
            const lines = text.trim().split('\n').filter(l => l.startsWith('data:'));
            const last = lines[lines.length - 1]?.replace(/^data:\s*/, '');
            let rebuttal = '';
            if (last) {
                try {
                    const parsed = JSON.parse(last);
                    const part = parsed.message?.parts?.find(
                        (p: { type?: string; text?: string }) => p?.type === 'text',
                    );
                    rebuttal = part?.text ?? '';
                } catch {
                    rebuttal = '';
                }
            }

            const basePrompt =
                'AI判定に反論します。創作寿司として成立するはずだと主張します。食用として安全で、創造的・融合的な寿司として成立すると説得します。';
            const composed = rebuttal || basePrompt;
            setInput(
                `AI判定に反論します。\nTopping: ${topping}\nBase: ${base}\nUser arguments: ${composed}`,
            );
        } catch (err) {
            console.error(err);
        } finally {
            setPendingRebuttal(false);
        }
    };

    const handleGenerateClick = () => {
        if (!lastPositiveJudge) return;
        const topping = lastPositiveJudge.input?.topping;
        const base = lastPositiveJudge.input?.base;
        setPendingGenerate(true);
        sendMessage({
            text: `judgeIsSushiでOKが出たので生成してください。\nTopping: ${topping ?? ''}\nBase: ${base ?? ''}`,
        }).finally(() => setPendingGenerate(false));
    };

    return (
        <div className="flex flex-col gap-4 min-h-[calc(100vh-7rem)]">
            <div className="flex-1 overflow-y-auto pr-1">
                <div className="space-y-3">
                    {messages.map(message => {
                        const isUser = message.role === 'user';
                        return (
                            <div key={message.id} className={`chat ${isUser ? 'chat-end' : 'chat-start'}`}>
                                <div className="chat-header">
                                    {isUser ? 'You' : 'AI'}
                                </div>
                                <div className="chat-bubble whitespace-pre-wrap">
                                    {message.parts.map((part, index) => {
                                        if (part.type === 'text') {
                                            return <p key={index}>{part.text}</p>;
                                        }

                                        if (part.type === 'tool-judgeIsSushi') {
                                            if (part.state === 'output-available' && part.output) {
                                                return (
                                                    <div key={index} className="text-sm space-y-1">
                                                        <div className="font-semibold">
                                                            判定: {part.output.isSushi ? '寿司として成立' : '寿司ではない'}
                                                        </div>
                                                        <div>{part.output.reasoning}</div>
                                                    </div>
                                                );
                                            }
                                            if (part.state === 'output-error') {
                                                return (
                                                    <div key={index} className="text-sm text-error">
                                                        判定に失敗しました: {part.errorText}
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div key={index} className="text-sm text-base-content/70">
                                                    判定中...
                                                </div>
                                            );
                                        }

                                        if (part.type === 'tool-createSushi') {
                                            if (part.state === 'output-available' && part.output) {
                                                return (
                                                    <div key={index} className="mt-3">
                                                        <Sushi {...part.output} />
                                                    </div>
                                                );
                                            }
                                            if (part.state === 'output-error') {
                                                return (
                                                    <div key={index} className="text-sm text-error">
                                                        生成に失敗しました: {part.errorText}
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div key={index} className="text-sm text-base-content/70">
                                                    生成中...
                                                </div>
                                            );
                                        }

                                        return null;
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {!hasSushiOutput && lastPositiveJudge && (
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body gap-3">
                        <p className="text-sm text-base-content/80">
                            判定OKです。生成を実行しますか？
                        </p>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleGenerateClick}
                                disabled={pendingGenerate}
                            >
                                {pendingGenerate ? 'Generating...' : '生成する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="card bg-base-100 shadow-md border border-base-200 sticky bottom-0">
                <div className="card-body gap-4">
                    <textarea
                        className="textarea textarea-bordered w-full"
                        placeholder="反論しよう！！"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        rows={3}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleRebuttal}
                            disabled={pendingRebuttal}
                        >
                            {pendingRebuttal ? '生成中...' : 'AI反論'}
                        </button>
                        <button type="submit" className="btn btn-primary" >
                            送信
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
