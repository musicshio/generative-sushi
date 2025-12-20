import { notFound } from 'next/navigation';
import { Sushi } from '@/components/sushi';
import prisma from "@/lib/prisma";

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    const shared = await prisma.sharedSushi.findUnique({ where: { id } });
    if (!shared) return notFound();

    return (
        <div className="p-4">
            <Sushi {...(shared.data as Parameters<typeof Sushi>[0])} />
        </div>
    );
}
