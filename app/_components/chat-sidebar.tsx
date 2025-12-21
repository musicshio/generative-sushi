'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { deleteChat, listChats, subscribeToChatChanges, type ChatSummary } from '@/util/local-chat-store';
import OpfsImage from '@/ui/opfs-image';

export function ChatSidebar() {
    const [chats, setChats] = useState<ChatSummary[]>([]);

    useEffect(() => {
        setChats(listChats());
        return subscribeToChatChanges(() => {
            setChats(listChats());
        });
    }, []);

    return (
        <ul className="menu w-full p-0">
            {chats.length === 0 && (
                <li className="text-base-content/70">
                    <span>まだ寿司がありません</span>
                </li>
            )}
            {chats.map(chat => (
                <li key={chat.id}>
                    <div className="flex justify-between items-center gap-2 w-full">
                        <Link href={`/${chat.id}`} className="flex-1 flex items-center gap-3">
                            <div className="avatar">
                                <div className="w-10 h-10 rounded-full border border-base-300 overflow-hidden bg-base-300">
                                    {chat.imagePath ? (
                                        <OpfsImage
                                            path={chat.imagePath}
                                            alt="sushi avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-base-300" />
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                    {chat.topping ?? 'Topping ?'} × {chat.base ?? 'Base ?'}
                                </span>
                            </div>
                        </Link>
                        <div className="dropdown dropdown-end">
                            <button tabIndex={0} className="btn btn-ghost btn-xs" type="button">
                                <span className="text-lg leading-none">⋯</span>
                            </button>
                            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box shadow p-2 w-40 z-10">
                                <li>
                                    <button
                                        type="button"
                                        className="text-error"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const confirmed = window.confirm('このチャットを削除しますか？');
                                            if (!confirmed) return;
                                            deleteChat(chat.id);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
