'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import {Sushi} from "@/components/sushi";

export default function Page() {
    const [input, setInput] = useState('');
    const { messages, sendMessage } = useChat();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage({ text: input });
        setInput('');
    };

    const [topping, setTopping] = useState('');
    const [base, setBase] = useState('');

    const handleSushiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage({
            text: `Topping: ${topping}, Base: ${base}`,
        });
    }

    return (
        <div>
            <form onSubmit={handleSushiSubmit}>
                <input
                    value={topping}
                    onChange={e => setTopping(e.target.value)}
                    placeholder="Topping"
                />
                <input
                    value={base}
                    onChange={e => setBase(e.target.value)}
                    placeholder="Base"
                />
                <button type='submit' className="btn btn-primary">
                    Create Sushi
                </button>
            </form>
            {messages.map(message => (
                <div key={message.id}>
                    <div>{message.role === 'user' ? 'User: ' : 'AI: '}</div>
                    <div>
                        {message.parts.map((part, index) => {
                            if (part.type === 'text') {
                                return <span key={index}>{part.text}</span>;
                            }

                            if (part.type === 'tool-createSushi') {
                                switch (part.state) {
                                    case 'input-available':
                                        return <div key={index}>Creating sushi...</div>;
                                    case 'output-available':
                                        return (
                                            <div key={index}>
                                                <Sushi {...part.output} />
                                            </div>
                                        );
                                    case 'output-error':
                                        return <div key={index}>Error: {part.errorText}</div>;
                                    default:
                                        return null;
                                }
                            }

                            return null;
                        })}
                    </div>
                </div>
            ))}

            <form onSubmit={handleSubmit}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}