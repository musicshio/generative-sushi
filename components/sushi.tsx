
'use client';

import { z } from 'zod';
import { sushiSchema } from "@/lib/schema/schema";
import OpfsImage from '@/ui/opfs-image';

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
    return (
        <div className={"p-2 md:p-4 lg:p-6"}>
            <div className="relative">
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
                <h2 className="card-title">{title}</h2>
                <p className="text-base-content/80">{description}</p>
            </div>

            <div className="space-y-2">
                <h3 className="font-semibold text-base">{etymology.label}</h3>
                <p className="text-base-content/80">{etymology.description}</p>
            </div>

            <div className="space-y-2">
                <h3 className="font-semibold text-base">{history.label}</h3>
                <ul className="space-y-1 text-base-content/80">
                    {history.events.map((event, index) => (
                        <li key={index} className="flex gap-2">
                            <span className="font-semibold min-w-[4rem]">{event.date}</span>
                            <span>{event.description}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold text-base">{recipe.label}</h3>
                <div>
                    <h4 className="text-sm font-semibold text-base-content/70">{recipe.ingredients.label}</h4>
                    <ul className="list-disc list-inside text-base-content/80 space-y-1">
                        {recipe.ingredients.items.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-base-content/70">{recipe.steps.label}</h4>
                    <ol className="list-decimal list-inside text-base-content/80 space-y-1">
                        {recipe.steps.items.map((step, index) => (
                            <li key={index}>{step}</li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
}
