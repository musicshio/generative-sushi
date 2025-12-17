import { deleteChat } from '@/util/chat-store';
import { NextResponse } from 'next/server';

export async function POST(
    _request: Request,
    { params }: { params: { id: string } },
) {
    await deleteChat(params.id);
    return NextResponse.redirect('/', { status: 303 });
}
