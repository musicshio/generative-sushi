'use client';

import { UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useMemo } from 'react';
import { Sushi } from '@/components/sushi';
import ChatContent from '@/app/[id]/_components/chat-content';

export type SushiDetailProps = {
    id: string;
    initialMessages: UIMessage[];
}

export default function SushiDetail({
                                 id,
                                 initialMessages,
                             }: SushiDetailProps) {
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

    const latestSushi = useMemo(
        () =>
            messages
                .flatMap(m => m.parts)
                .filter(
                    (part): part is Extract<UIMessage['parts'][number], { type: 'tool-createSushi' }> =>
                        part.type === 'tool-createSushi' &&
                        part.state === 'output-available' &&
                        !!part.output,
                )
                .pop(),
        [messages],
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

    const showSplit = lastPositiveJudge?.output?.isSushi;

    const chatContent = (
        <ChatContent
            className="flex flex-col gap-4 min-h-0 h-full"
            id={id}
            messages={messages}
            hasSushiOutput={hasSushiOutput}
            lastPositiveJudge={lastPositiveJudge}
            sendMessage={sendMessage}
        />
    );

    if (!showSplit) {
        return chatContent;
    }

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-full max-h-full">
            <div className="order-2 lg:order-1 flex-none w-full lg:w-96 h-full max-h-full border border-base-200 rounded lg:overflow-y-auto">
                {chatContent}
            </div>
            <div className="order-1 lg:order-2 flex-1 min-h-0 overflow-y-auto">
                {latestSushi?.output ? (
                    <Sushi {...latestSushi.output} />
                ) : (
                    <div className="card bg-base-100 shadow-md border border-base-200">
                        <div className="card-body">
                            <p className="text-sm text-base-content/70">寿司wikiを生成中...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
