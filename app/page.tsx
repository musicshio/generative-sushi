'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateId, UIMessage } from 'ai';

export default function Page() {
    const router = useRouter();
    const [topping, setTopping] = useState('');
    const [base, setBase] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSushiSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topping.trim() || !base.trim() || submitting) return;
        setSubmitting(true);
        setError(null);

        try {
            const id = generateId();
            const message: UIMessage = {
                id: generateId(),
                role: 'user',
                metadata: { topping, base },
                parts: [{ type: 'text', text: `Topping: ${topping}\nBase: ${base}` }],
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
            setSubmitting(false);
        }
    };

    return (
        <>
            {submitting && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-base-200/80 backdrop-blur-md">
                    <span className="loading loading-spinner loading-lg text-primary" aria-hidden />
                    <div className="text-center space-y-1">
                        <p className="font-semibold text-base-content">お寿司を仕込み中…</p>
                        <p className="text-sm text-base-content/70">少しだけ待っててね</p>
                    </div>
                </div>
            )}
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <div className="card w-full max-w-4xl bg-base-100 shadow-xl">
                    <div className="card-body grid md:grid-cols-[1.1fr_0.9fr] gap-10">
                        <div className="relative flex justify-center">
                            <div className="bg-base-200 rounded-3xl p-8 w-full max-w-lg">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <p className="text-sm text-base-content/60">Let&apos;s craft</p>
                                        <h2 className="text-2xl font-semibold">とくべつなおすし</h2>
                                    </div>
                                    <div className="badge badge-outline badge-primary">Cute Mode</div>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-1/2 -translate-x-1/2 top-4 text-xs text-base-content/60">
                                        トッピング
                                    </div>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-28 h-10 bg-primary/80 rounded-full blur-2xl opacity-60"></div>
                                        <div className="w-32 h-10 bg-secondary/80 rounded-full blur-2xl opacity-60"></div>
                                    </div>
                                    <div className="relative mt-2 flex flex-col items-center gap-2">
                                        <div className="w-28 h-6 bg-primary rounded-full shadow-md"></div>
                                        <div className="w-32 h-8 bg-secondary rounded-full shadow-md"></div>
                                        <div className="w-36 h-4 bg-base-300 rounded-full shadow-inner"></div>
                                        <div className="w-28 h-4 bg-base-300 rounded-full shadow-inner -mt-1"></div>
                                    </div>
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-2 text-xs text-base-content/60">
                                        シャリ
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm text-base-content/70">ネタとシャリを入力してね</p>
                                <h3 className="text-xl font-semibold">オリジナル寿司を生成するよ</h3>
                            </div>
                            <form onSubmit={handleSushiSubmit} className="space-y-4">
                                <label className="form-control w-full">
                                    <div className="label">
                                        <span className="label-text">Topping</span>
                                        <span className="badge badge-primary badge-outline text-xs">ネタ</span>
                                    </div>
                                    <input
                                        value={topping}
                                        onChange={e => setTopping(e.target.value)}
                                        placeholder="例: サーモン、いくら、アボカド"
                                        className="input input-bordered w-full"
                                    />
                                </label>
                                <label className="form-control w-full">
                                    <div className="label">
                                        <span className="label-text">Base</span>
                                        <span className="badge badge-secondary badge-outline text-xs">シャリ</span>
                                    </div>
                                    <input
                                        value={base}
                                        onChange={e => setBase(e.target.value)}
                                        placeholder="例: 白ご飯、酢飯、玄米、カリフラワーライス"
                                        className="input input-bordered w-full"
                                    />
                                </label>
                                <button type='submit' className="btn btn-primary w-full" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Sushi'}
                                </button>
                            </form>
                            {error && <p className="text-error text-sm">{error}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
