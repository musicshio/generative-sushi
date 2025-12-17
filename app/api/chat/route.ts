import { streamText, convertToModelMessages, UIMessage, validateUIMessages } from 'ai';
import { tools } from '@/lib/ai/tools';
import { loadChat, saveChat } from '@/util/chat-store';

export async function POST(request: Request) {
    const { message, id }: { message: UIMessage, id: string } = await request.json();


    // Load previous messages from database
    const previousMessages = await loadChat(id);

    // Append new message to previousMessages messages
    const messages = [...previousMessages, message];

    const validatedMessages = await validateUIMessages({
        messages,
        tools, // Ensures tool calls in messages match current schemas
    });

    const result = streamText({
        model: 'openai/gpt-5-mini',
        messages: convertToModelMessages(validatedMessages),
        tools,
    });

    return result.toUIMessageStreamResponse({
        originalMessages: messages,
        onFinish: ({ messages }) => {
            saveChat({ chatId: id, messages });
        },
    });
}
