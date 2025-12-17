'use client';

import { useTransition } from 'react';

export function ChatDeleteButton({ chatId }: { chatId: string }) {
    const [pending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            const confirmed = window.confirm('このチャットを削除しますか？');
            if (!confirmed) return;
            await fetch(`/api/chats/${chatId}/delete`, { method: 'POST' });
            window.location.href = '/';
        });
    };

    return (
        <button
            type="button"
            className="text-error"
            onClick={(e) => {
                e.stopPropagation();
                handleDelete();
            }}
            disabled={pending}
        >
            {pending ? 'Deleting...' : 'Delete'}
        </button>
    );
}
