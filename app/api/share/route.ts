import { put } from '@vercel/blob';
import prisma from "@/lib/prisma";

type SharePayload = {
    topping: string;
    base: string;
    title: string;
    description: string;
    etymology: { label: string; description: string };
    recipe: {
        label: string;
        ingredients: { label: string; items: string[] };
        steps: { label: string; items: string[] };
    };
    history: { label: string; events: { date: string; description: string }[] };
    image?: string | null;
};

export async function POST(request: Request) {
    const form = await request.formData();
    const rawData = form.get('data');
    if (typeof rawData !== 'string') {
        return new Response('Invalid data', { status: 400 });
    }

    let parsed: SharePayload;
    try {
        parsed = JSON.parse(rawData) as SharePayload;
    } catch {
        return new Response('Invalid JSON', { status: 400 });
    }

    const imageFile = form.get('image');
    let imageUrl: string | null = null;
    if (imageFile instanceof File) {
        const ext = imageFile.type.split('/')[1] || 'png';
        const path = `sushi/${crypto.randomUUID()}.${ext}`;
        const uploaded = await put(path, imageFile, {
            access: 'public',
            contentType: imageFile.type || 'image/png',
        });
        imageUrl = uploaded.url;
    }

    const data = {
        ...parsed,
        image: imageUrl ?? parsed.image ?? null,
    };

    const created = await prisma.sharedSushi.create({
        data: {
            data,
            imageUrl,
        },
    });

    return Response.json({ id: created.id });
}
