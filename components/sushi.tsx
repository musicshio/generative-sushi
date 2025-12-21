
'use client';

import { z } from 'zod';
import { sushiSchema } from "@/lib/schema/schema";
import OpfsImage from '@/ui/opfs-image';
import HeadingAnchor from '@/ui/heading-anchor';

type SushiProps = z.infer<typeof sushiSchema>;

export const Sushi = ({
    topping,
    base,
    title,
    description,
    etymology,
    recipe,
    history,
    image,
}: SushiProps) => {
    const etymologyId = makeHeadingId(etymology.label, 'etymology');
    const historyId = makeHeadingId(history.label, 'history');
    const recipeId = makeHeadingId(recipe.label, 'recipe');

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-12">
            <div className="relative space-y-3">
                    {image && (
                        <div className="md:float-right md:ml-6 md:w-56 w-full mb-4 md:mb-2">
                            <OpfsImage
                                path={image}
                                alt={`${topping} on ${base}`}
                                className="w-full rounded-xl object-cover border border-base-200 shadow-sm"
                            />
                            <p className="text-xs text-base-content/70 mt-2 text-center">イメージ画像</p>
                        </div>
                    )}
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-semibold leading-tight">{title}</h1>
                    <div className="h-px w-full bg-base-300" aria-hidden="true" />
                </div>
                <p className="text-base-content/80 leading-relaxed">{description}</p>
            </div>

            <div className="space-y-3">
                <h2 id={etymologyId} className="text-lg md:text-xl font-semibold flex items-center gap-2">
                    <HeadingAnchor id={etymologyId} label={etymology.label} />
                    {etymology.label}
                </h2>
                <p className="text-base-content/80 leading-relaxed">{etymology.description}</p>
            </div>

            <div className="space-y-3">
                <h2 id={historyId} className="text-lg md:text-xl font-semibold flex items-center gap-2">
                    <HeadingAnchor id={historyId} label={history.label} />
                    {history.label}
                </h2>
                <ul className="space-y-2 text-base-content/80">
                    {history.events.map((event, index) => (
                        <li key={index} className="flex gap-2 leading-relaxed">
                            <span className="font-semibold min-w-[4rem]">{event.date}</span>
                            <span>{event.description}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="space-y-4">
                <h2 id={recipeId} className="text-lg md:text-xl font-semibold flex items-center gap-2">
                    <HeadingAnchor id={recipeId} label={recipe.label} />
                    {recipe.label}
                </h2>
                <div className="space-y-2">
                    <h3 className="text-sm md:text-base font-semibold text-base-content/70">{recipe.ingredients.label}</h3>
                    <ul className="list-disc list-inside text-base-content/80 space-y-2">
                        {recipe.ingredients.items.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm md:text-base font-semibold text-base-content/70">{recipe.steps.label}</h3>
                    <ol className="list-decimal list-inside text-base-content/80 space-y-2">
                        {recipe.steps.items.map((step, index) => (
                            <li key={index}>{step}</li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
}

function makeHeadingId(text: string, fallback: string) {
    const normalized = text.trim().replace(/\s+/g, '-');
    return normalized.length > 0 ? normalized : fallback;
}
