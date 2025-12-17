import { deleteChat } from '@/util/chat-store';

export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } },
) {
    const { id } = params;
    await deleteChat(id);
    return new Response(null, { status: 204 });
}
