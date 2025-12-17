
import { z } from 'zod';
import {sushiSchema} from "@/lib/schema/schema";

type SushiProps = z.infer<typeof sushiSchema>;

export const Sushi = ({
    topping,
    base,
    title,
    description,
    etymology,
    recipe,
    history,
}: SushiProps) => {
    return (
        <div>
            <h1>{title}</h1>
            <p>{description}</p>
            <h2>{etymology.label}</h2>
            <p>{etymology.description}</p>
            <h2>{history.label}</h2>
            <ul>
                {history.events.map((event, index) => (
                    <li key={index}>
                        <strong>{event.date}:</strong> {event.description}
                    </li>
                ))}
            </ul>
            <h2>{recipe.label}</h2>
            <h3>{recipe.ingredients.label}</h3>
            <ul>
                {recipe.ingredients.items.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
            <h3>{recipe.steps.label}</h3>
            <ol>
                {recipe.steps.items.map((step, index) => (
                    <li key={index}>{step}</li>
                ))}
            </ol>
        </div>
    );
}