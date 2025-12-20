import { streamText, convertToModelMessages, UIMessage, validateUIMessages } from 'ai';
import { tools } from '@/lib/ai/tools';

const systemPrompt = `You are a strict sushi gatekeeper assistant.
- Always first judge if topping/base can be considered sushi by calling the "judgeIsSushi" tool.
- If judgeIsSushi returns isSushi === true, call "createSushi" immediately in the same turn using the same topping/base (and optional userArguments if helpful). Do not wait for extra confirmation.
- If not convinced (isSushi === false), explain why and continue the conversation; do not call createSushi until a later judgeIsSushi returns true.
- Keep tone friendly but firm, focusing on safety and plausibility.`;

export async function POST(request: Request) {
    const req = await request.json();
    const { messages, message } = req as {
        id?: string;
        messages?: UIMessage[];
        message?: UIMessage;
    };
    const inputMessages = messages ?? (message ? [message] : []);

    const validatedMessages = await validateUIMessages({
        messages: inputMessages,
        tools, // Ensures tool calls in messages match current schemas
    }).catch((err) => {
        console.error('Message validation error:', JSON.stringify(err, null, 2));
        throw err;
    })

    const result = streamText({
        model: 'openai/gpt-5-mini',
        system: systemPrompt,
        messages: convertToModelMessages(validatedMessages),
        tools,
    });

    return result.toUIMessageStreamResponse({
        originalMessages: inputMessages,
    });
}
