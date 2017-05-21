import {Condiment} from "./api/CondimentRestService";

export class CondimentCategoryService {

    public static groupCondimentsByCategory(condiments: Array<Condiment>): Array<[string, Array<Condiment>]> {
        return Array.from(
            condiments.reduce(
                (categories: Map<string, Array<Condiment>>, condiment: Condiment) => {
                    if (categories.has(condiment.category)) {
                        categories.get(condiment.category).push(condiment);
                    } else {
                        categories.set(condiment.category, [condiment]);
                    }
                    return categories;
                },
                new Map<string, Array<Condiment>>()
            ).entries()
        );
    }

}