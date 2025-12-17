'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Sushi } from '@/components/sushi';

export default function Chat({
                                 id,
                                 initialMessages,
                             }: { id?: string | undefined; initialMessages?: UIMessage[] } = {}) {
    const { messages } = useChat({
        id,
        messages: initialMessages,
        transport: new DefaultChatTransport({
            api: '/api/chat',
        }),
    });

    const sushiParts = messages
        .map(m => m.parts.filter(p => p.type === 'tool-createSushi'))
        .flat();

    return (
        <div className="space-y-4">
            {sushiParts.length === 0 && (
                <p className="text-base-content/70">Sushiカードがまだありません。</p>
            )}
            {sushiParts.map((part, index) => {
                if (part.type !== 'tool-createSushi') return null;
                if (part.state === 'output-available' && part.output) {
                    return <Sushi key={index} {...part.output} />;
                }
                if (part.state === 'output-error') {
                    return (
                        <div key={index} className="alert alert-error">
                            エラーが発生しました: {part.errorText}
                        </div>
                    );
                }
                return (
                    <div key={index} className="text-base-content/70">
                        作成中...
                    </div>
                );
            })}
        </div>
    );
}
