'use client';

import type { UIMessage } from '@ai-sdk/react';
import { useEffect, useMemo, useRef, useState } from 'react';

type JudgePart = Extract<UIMessage['parts'][number], { type: 'tool-judgeIsSushi' }>;

type ChatContentProps = {
    className?: string;
    id?: string;
    messages: UIMessage[];
    hasSushiOutput: boolean;
    sendMessage: (message: {
        text: string;
        metadata?: { topping?: string; base?: string; judgeIsSushiConfirmed?: boolean };
    }) => Promise<void> | void;
};

export default function ChatContent({
    className,
    id,
    messages,
    hasSushiOutput,
    sendMessage,
}: ChatContentProps) {
    const lastJudge = messages
        .flatMap(m => m.parts)
        .filter(
            (part): part is JudgePart =>
                part.type === 'tool-judgeIsSushi' &&
                part.state === 'output-available' &&
                !!part.output,
        )
        .pop();

    const [input, setInput] = useState('');
    const [pendingRebuttal, setPendingRebuttal] = useState(false);
    const lastAutoGenerateRef = useRef<string | null>(null);
    const lastChatIdRef = useRef<string | null>(null);

    const lastJudgeInfo = useMemo(() => {
        let result:
            | {
                  key: string;
                  isSushi: boolean;
                  topping: string;
                  base: string;
              }
            | undefined;
        messages.forEach(message => {
            message.parts.forEach((part, index) => {
                if (
                    part.type === 'tool-judgeIsSushi' &&
                    part.state === 'output-available' &&
                    part.output
                ) {
                    result = {
                        key: `${message.id}:${index}`,
                        isSushi: part.output.isSushi,
                        topping: part.input?.topping ?? '',
                        base: part.input?.base ?? '',
                    };
                }
            });
        });
        return result;
    }, [messages]);

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
        try {
            const res = await fetch('/api/rebuttal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
            });
            if (!res.ok) {
                throw new Error('Failed to rebut');
            }
            const data = (await res.json()) as { text?: string };
            const rebuttal = data.text?.trim();
            if (!rebuttal) {
                throw new Error('Empty rebuttal');
            }
            await sendMessage({ text: rebuttal });
        } catch (err) {
            console.error(err);
        } finally {
            setPendingRebuttal(false);
        }
    };

    useEffect(() => {
        if (id && lastChatIdRef.current !== id) {
            lastChatIdRef.current = id;
            lastAutoGenerateRef.current = lastJudgeInfo?.key ?? null;
            return;
        }
        if (!lastJudgeInfo || !lastJudgeInfo.isSushi || hasSushiOutput) return;
        if (!lastJudgeInfo.topping || !lastJudgeInfo.base) return;
        if (lastAutoGenerateRef.current === lastJudgeInfo.key) return;
        lastAutoGenerateRef.current = lastJudgeInfo.key;
        void Promise.resolve(
            sendMessage({
                text: `ネタが${lastJudgeInfo.topping}、シャリが${lastJudgeInfo.base}の寿司を握ってください。`,
                metadata: {
                    judgeIsSushiConfirmed: true,
                    topping: lastJudgeInfo.topping,
                    base: lastJudgeInfo.base,
                },
            }),
        );
    }, [hasSushiOutput, id, lastJudgeInfo, sendMessage]);

    return (
        <div className={className}>
            <div className="flex-1 min-h-0 overflow-y-auto lg:pr-2">
                <div className="space-y-3 p-2 pb-6">
                    {messages.map(message => {
                        const isUser = message.role === 'user';
                        const judgePart = message.parts.find(
                            part =>
                                part.type === 'tool-judgeIsSushi' &&
                                part.state === 'output-available' &&
                                part.output,
                        );
                        const bubbleVariant = judgePart?.output?.isSushi
                            ? 'chat-bubble-success'
                            : judgePart
                                ? 'chat-bubble-error'
                                : '';
                        return (
                            <div key={message.id} className={`chat ${isUser ? 'chat-end' : 'chat-start'}`}>
                                <div className="chat-header">
                                    {isUser ? 'You' : 'Itamae'}
                                </div>
                                <div className={`chat-bubble whitespace-pre-wrap ${bubbleVariant}`}>
                                    {message.parts.map((part, index) => {
                                        if (part.type === 'text') {
                                            return <p key={index} className="text-sm">{part.text}</p>;
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
                                                    <div key={index} className="text-sm">
                                                        へいお待ち！
                                                    </div>
                                                );
                                            }
                                            if (part.state === 'output-error') {
                                                return (
                                                    <div key={index} className="text-sm text-error">
                                                        握りに失敗しました: {part.errorText}
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div key={index} className="text-sm text-base-content/70">
                                                    握り中...
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

            {lastJudge?.output?.isSushi === false && (
                <form onSubmit={handleSubmit} className="card bg-base-100 shadow-md border border-base-200">
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
                                className="btn btn-soft btn-primary"
                                onClick={handleRebuttal}
                                disabled={pendingRebuttal}
                            >
                                {pendingRebuttal ? '反論中...' : 'AI反論'}
                            </button>
                            <button type="submit" className="btn btn-primary" >
                                送信
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
