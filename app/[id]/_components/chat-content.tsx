'use client';

import type { UIMessage } from '@ai-sdk/react';
import { useState } from 'react';

type JudgePart = Extract<UIMessage['parts'][number], { type: 'tool-judgeIsSushi' }>;

type ChatContentProps = {
    className?: string;
    id?: string;
    messages: UIMessage[];
    hasSushiOutput: boolean;
    lastPositiveJudge?: JudgePart;
    sendMessage: (message: { text: string; metadata?: { topping?: string; base?: string } }) => Promise<void> | void;
};

export default function ChatContent({
    className,
    id,
    messages,
    hasSushiOutput,
    lastPositiveJudge,
    sendMessage,
}: ChatContentProps) {
    const [input, setInput] = useState('');
    const [pendingGenerate, setPendingGenerate] = useState(false);
    const [pendingRebuttal, setPendingRebuttal] = useState(false);

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
        <div className={className}>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <div className="space-y-3">
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

            {!lastPositiveJudge?.output?.isSushi && (
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
            )}
        </div>
    );
}
