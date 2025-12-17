import { createChat } from '@/util/chat-store';

export async function POST() {
    const id = await createChat();
    return Response.json({ id });
}
