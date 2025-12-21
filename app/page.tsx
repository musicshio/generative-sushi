'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateId, UIMessage } from 'ai';

export default function Page() {
    const router = useRouter();
    const [topping, setTopping] = useState('');
    const [base, setBase] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSushiSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topping.trim() || !base.trim()) return;
        setError(null);

        try {
            const id = generateId();
            const message: UIMessage = {
                id: generateId(),
                role: 'user',
                metadata: { topping, base },
                parts: [{ type: 'text', text: `${topping}を${base}に乗せたものは寿司ではないでしょうか？` }],
            };

            window.sessionStorage.setItem(
                `sushi:chat:pending:${id}`,
                JSON.stringify({
                    text: message.parts[0].type === 'text' ? message.parts[0].text : '',
                    metadata: message.metadata as { topping?: string; base?: string },
                }),
            );

            router.push(`/${id}`);
        } catch (err) {
            console.error(err);
            setError('チャットの開始に失敗しました。もう一度お試しください。');
        }
    };

    return (
        <div className="min-h-full flex items-center justify-center bg-base-200 p-2">
            <div className="card w-full max-w-4xl bg-base-100 shadow">
                <div className="card-body gap-10">
                    <div className="space-y-4">
                        <div className="space-y-4">
                            <h1 className="text-2xl font-semibold">寿司ってなんだ？</h1>
                            <div className="space-y-2">
                                <p className="text-sm text-base-content/70">寿司かどうかなんて、本当は誰が決めてるんだろう。</p>
                                <p className="text-sm text-base-content/70">ネタは魚じゃないといけない？</p>
                                <p className="text-sm text-base-content/70">シャリは米じゃないといけない？</p>
                                <p className="text-sm text-base-content/70">いやいや、寿司の可能性は無限大。</p>
                                <p className="text-md font-bold text-base-content/70">これはもう寿司ってことになりませんかね？</p>
                            </div>
                        </div>
                        <form onSubmit={handleSushiSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <div className="form-control w-full">
                                    <div className="label">
                                        <span className="label-text">ネタ</span>
                                    </div>
                                    <input
                                        value={topping}
                                        onChange={e => setTopping(e.target.value)}
                                        placeholder="例: サーモン、いくら、アボカド"
                                        className="input input-bordered w-full"
                                    />
                                </div>
                                <div className="form-control w-full">
                                    <div className="label">
                                        <span className="label-text">シャリ</span>
                                    </div>
                                    <input
                                        value={base}
                                        onChange={e => setBase(e.target.value)}
                                        placeholder="例: 白ご飯、酢飯、玄米、カリフラワーライス"
                                        className="input input-bordered w-full"
                                    />
                                </div>
                            </div>
                            <button type='submit' className="btn btn-primary w-full">
                                これは寿司なのではないでしょうか！
                            </button>
                        </form>
                        {error && <p className="text-error text-sm">{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
