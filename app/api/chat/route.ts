import { streamText, convertToModelMessages, UIMessage, stepCountIs } from 'ai';
import { tools } from '@/lib/ai/tools';

export async function POST(request: Request) {
    const { messages }: { messages: UIMessage[] } = await request.json();

    const result = streamText({
        model: "anthropic/claude-sonnet-4.5",
        system: 'You are a friendly assistant!',
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
        tools,
    });

    return result.toUIMessageStreamResponse();
}