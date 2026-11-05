import { z } from 'zod';
export declare const CreateItemInputSchema: z.ZodObject<{
    storeId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    price: z.ZodString;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isSoldOut: z.ZodOptional<z.ZodBoolean>;
    sortIndex: z.ZodOptional<z.ZodNumber>;
    optionsJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** The store's menu section; null takes the item out of every section. */
    sectionId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stockQty: z.ZodOptional<z.ZodNumber>;
    allergensJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    isVegan: z.ZodOptional<z.ZodBoolean>;
    isVegetarian: z.ZodOptional<z.ZodBoolean>;
    isGlutenFree: z.ZodOptional<z.ZodBoolean>;
    isDairyFree: z.ZodOptional<z.ZodBoolean>;
    spicyLevel: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    storeId: string;
    price: string;
    sortIndex?: number | undefined;
    isActive?: boolean | undefined;
    isSoldOut?: boolean | undefined;
    optionsJson?: Record<string, unknown> | undefined;
    sectionId?: string | null | undefined;
    stockQty?: number | undefined;
    allergensJson?: Record<string, unknown> | undefined;
    isVegan?: boolean | undefined;
    isVegetarian?: boolean | undefined;
    isGlutenFree?: boolean | undefined;
    isDairyFree?: boolean | undefined;
    spicyLevel?: number | undefined;
}, {
    description: string;
    title: string;
    storeId: string;
    price: string;
    sortIndex?: number | undefined;
    isActive?: boolean | undefined;
    isSoldOut?: boolean | undefined;
    optionsJson?: Record<string, unknown> | undefined;
    sectionId?: string | null | undefined;
    stockQty?: number | undefined;
    allergensJson?: Record<string, unknown> | undefined;
    isVegan?: boolean | undefined;
    isVegetarian?: boolean | undefined;
    isGlutenFree?: boolean | undefined;
    isDairyFree?: boolean | undefined;
    spicyLevel?: number | undefined;
}>;
export declare const UpdateItemInputSchema: z.ZodEffects<z.ZodObject<{
    storeId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodString;
    price: z.ZodString;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isSoldOut: z.ZodOptional<z.ZodBoolean>;
    sortIndex: z.ZodOptional<z.ZodNumber>;
    optionsJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    /** The store's menu section; null takes the item out of every section. */
    sectionId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stockQty: z.ZodOptional<z.ZodNumber>;
    allergensJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    isVegan: z.ZodOptional<z.ZodBoolean>;
    isVegetarian: z.ZodOptional<z.ZodBoolean>;
    isGlutenFree: z.ZodOptional<z.ZodBoolean>;
    isDairyFree: z.ZodOptional<z.ZodBoolean>;
    spicyLevel: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    price: string;
    sortIndex?: number | undefined;
    storeId?: string | undefined;
    isActive?: boolean | undefined;
    isSoldOut?: boolean | undefined;
    optionsJson?: Record<string, unknown> | undefined;
    sectionId?: string | null | undefined;
    stockQty?: number | undefined;
    allergensJson?: Record<string, unknown> | undefined;
    isVegan?: boolean | undefined;
    isVegetarian?: boolean | undefined;
    isGlutenFree?: boolean | undefined;
    isDairyFree?: boolean | undefined;
    spicyLevel?: number | undefined;
}, {
    description: string;
    title: string;
    price: string;
    sortIndex?: number | undefined;
    storeId?: string | undefined;
    isActive?: boolean | undefined;
    isSoldOut?: boolean | undefined;
    optionsJson?: Record<string, unknown> | undefined;
    sectionId?: string | null | undefined;
    stockQty?: number | undefined;
    allergensJson?: Record<string, unknown> | undefined;
    isVegan?: boolean | undefined;
    isVegetarian?: boolean | undefined;
    isGlutenFree?: boolean | undefined;
    isDairyFree?: boolean | undefined;
    spicyLevel?: number | undefined;
}>, {
    description: string;
    title: string;
    price: string;
    sortIndex?: number | undefined;
    storeId?: string | undefined;
    isActive?: boolean | undefined;
    isSoldOut?: boolean | undefined;
    optionsJson?: Record<string, unknown> | undefined;
    sectionId?: string | null | undefined;
    stockQty?: number | undefined;
    allergensJson?: Record<string, unknown> | undefined;
    isVegan?: boolean | undefined;
    isVegetarian?: boolean | undefined;
    isGlutenFree?: boolean | undefined;
    isDairyFree?: boolean | undefined;
    spicyLevel?: number | undefined;
}, {
    description: string;
    title: string;
    price: string;
    sortIndex?: number | undefined;
    storeId?: string | undefined;
    isActive?: boolean | undefined;
    isSoldOut?: boolean | undefined;
    optionsJson?: Record<string, unknown> | undefined;
    sectionId?: string | null | undefined;
    stockQty?: number | undefined;
    allergensJson?: Record<string, unknown> | undefined;
    isVegan?: boolean | undefined;
    isVegetarian?: boolean | undefined;
    isGlutenFree?: boolean | undefined;
    isDairyFree?: boolean | undefined;
    spicyLevel?: number | undefined;
}>;
export declare const ItemResponseSchema: z.ZodObject<{
    storeId: z.ZodString;
    store: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    price: z.ZodString;
    isActive: z.ZodNullable<z.ZodBoolean>;
    isSoldOut: z.ZodNullable<z.ZodBoolean>;
    sortIndex: z.ZodNullable<z.ZodNumber>;
    optionsJson: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sectionId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stockQty: z.ZodNullable<z.ZodNumber>;
    allergensJson: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    isVegan: z.ZodNullable<z.ZodBoolean>;
    isVegetarian: z.ZodNullable<z.ZodBoolean>;
    isGlutenFree: z.ZodNullable<z.ZodBoolean>;
    isDairyFree: z.ZodNullable<z.ZodBoolean>;
    spicyLevel: z.ZodNullable<z.ZodNumber>;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    media: z.ZodString;
    cartItems: z.ZodString;
    orderItems: z.ZodString;
    bundleItems: z.ZodString;
    FavoriteItem: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodObject<{
        slug: z.ZodString;
        label: z.ZodString;
        category: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        slug: string;
        label: string;
        category: string;
    }, {
        slug: string;
        label: string;
        category: string;
    }>, "many">>;
    mediaAssets: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        kind: z.ZodString;
        sortIndex: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        kind: string;
        sortIndex?: number | null | undefined;
    }, {
        url: string;
        kind: string;
        sortIndex?: number | null | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    FavoriteItem: string;
    media: string;
    sortIndex: number | null;
    storeId: string;
    price: string;
    isActive: boolean | null;
    isSoldOut: boolean | null;
    optionsJson: Record<string, unknown> | null;
    stockQty: number | null;
    allergensJson: Record<string, unknown> | null;
    isVegan: boolean | null;
    isVegetarian: boolean | null;
    isGlutenFree: boolean | null;
    isDairyFree: boolean | null;
    spicyLevel: number | null;
    store: string;
    cartItems: string;
    orderItems: string;
    bundleItems: string;
    tags?: {
        slug: string;
        label: string;
        category: string;
    }[] | undefined;
    imageUrl?: string | null | undefined;
    mediaAssets?: {
        url: string;
        kind: string;
        sortIndex?: number | null | undefined;
    }[] | undefined;
    sectionId?: string | null | undefined;
}, {
    description: string;
    title: string;
    FavoriteItem: string;
    media: string;
    sortIndex: number | null;
    storeId: string;
    price: string;
    isActive: boolean | null;
    isSoldOut: boolean | null;
    optionsJson: Record<string, unknown> | null;
    stockQty: number | null;
    allergensJson: Record<string, unknown> | null;
    isVegan: boolean | null;
    isVegetarian: boolean | null;
    isGlutenFree: boolean | null;
    isDairyFree: boolean | null;
    spicyLevel: number | null;
    store: string;
    cartItems: string;
    orderItems: string;
    bundleItems: string;
    tags?: {
        slug: string;
        label: string;
        category: string;
    }[] | undefined;
    imageUrl?: string | null | undefined;
    mediaAssets?: {
        url: string;
        kind: string;
        sortIndex?: number | null | undefined;
    }[] | undefined;
    sectionId?: string | null | undefined;
}>;
export declare const ItemListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        storeId: z.ZodString;
        store: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        price: z.ZodString;
        isActive: z.ZodNullable<z.ZodBoolean>;
        isSoldOut: z.ZodNullable<z.ZodBoolean>;
        sortIndex: z.ZodNullable<z.ZodNumber>;
        optionsJson: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        sectionId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        stockQty: z.ZodNullable<z.ZodNumber>;
        allergensJson: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        isVegan: z.ZodNullable<z.ZodBoolean>;
        isVegetarian: z.ZodNullable<z.ZodBoolean>;
        isGlutenFree: z.ZodNullable<z.ZodBoolean>;
        isDairyFree: z.ZodNullable<z.ZodBoolean>;
        spicyLevel: z.ZodNullable<z.ZodNumber>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        media: z.ZodString;
        cartItems: z.ZodString;
        orderItems: z.ZodString;
        bundleItems: z.ZodString;
        FavoriteItem: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodObject<{
            slug: z.ZodString;
            label: z.ZodString;
            category: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            slug: string;
            label: string;
            category: string;
        }, {
            slug: string;
            label: string;
            category: string;
        }>, "many">>;
        mediaAssets: z.ZodOptional<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            kind: z.ZodString;
            sortIndex: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            kind: string;
            sortIndex?: number | null | undefined;
        }, {
            url: string;
            kind: string;
            sortIndex?: number | null | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        title: string;
        FavoriteItem: string;
        media: string;
        sortIndex: number | null;
        storeId: string;
        price: string;
        isActive: boolean | null;
        isSoldOut: boolean | null;
        optionsJson: Record<string, unknown> | null;
        stockQty: number | null;
        allergensJson: Record<string, unknown> | null;
        isVegan: boolean | null;
        isVegetarian: boolean | null;
        isGlutenFree: boolean | null;
        isDairyFree: boolean | null;
        spicyLevel: number | null;
        store: string;
        cartItems: string;
        orderItems: string;
        bundleItems: string;
        tags?: {
            slug: string;
            label: string;
            category: string;
        }[] | undefined;
        imageUrl?: string | null | undefined;
        mediaAssets?: {
            url: string;
            kind: string;
            sortIndex?: number | null | undefined;
        }[] | undefined;
        sectionId?: string | null | undefined;
    }, {
        description: string;
        title: string;
        FavoriteItem: string;
        media: string;
        sortIndex: number | null;
        storeId: string;
        price: string;
        isActive: boolean | null;
        isSoldOut: boolean | null;
        optionsJson: Record<string, unknown> | null;
        stockQty: number | null;
        allergensJson: Record<string, unknown> | null;
        isVegan: boolean | null;
        isVegetarian: boolean | null;
        isGlutenFree: boolean | null;
        isDairyFree: boolean | null;
        spicyLevel: number | null;
        store: string;
        cartItems: string;
        orderItems: string;
        bundleItems: string;
        tags?: {
            slug: string;
            label: string;
            category: string;
        }[] | undefined;
        imageUrl?: string | null | undefined;
        mediaAssets?: {
            url: string;
            kind: string;
            sortIndex?: number | null | undefined;
        }[] | undefined;
        sectionId?: string | null | undefined;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    data: {
        description: string;
        title: string;
        FavoriteItem: string;
        media: string;
        sortIndex: number | null;
        storeId: string;
        price: string;
        isActive: boolean | null;
        isSoldOut: boolean | null;
        optionsJson: Record<string, unknown> | null;
        stockQty: number | null;
        allergensJson: Record<string, unknown> | null;
        isVegan: boolean | null;
        isVegetarian: boolean | null;
        isGlutenFree: boolean | null;
        isDairyFree: boolean | null;
        spicyLevel: number | null;
        store: string;
        cartItems: string;
        orderItems: string;
        bundleItems: string;
        tags?: {
            slug: string;
            label: string;
            category: string;
        }[] | undefined;
        imageUrl?: string | null | undefined;
        mediaAssets?: {
            url: string;
            kind: string;
            sortIndex?: number | null | undefined;
        }[] | undefined;
        sectionId?: string | null | undefined;
    }[];
    total: number;
    page: number;
    limit: number;
}, {
    data: {
        description: string;
        title: string;
        FavoriteItem: string;
        media: string;
        sortIndex: number | null;
        storeId: string;
        price: string;
        isActive: boolean | null;
        isSoldOut: boolean | null;
        optionsJson: Record<string, unknown> | null;
        stockQty: number | null;
        allergensJson: Record<string, unknown> | null;
        isVegan: boolean | null;
        isVegetarian: boolean | null;
        isGlutenFree: boolean | null;
        isDairyFree: boolean | null;
        spicyLevel: number | null;
        store: string;
        cartItems: string;
        orderItems: string;
        bundleItems: string;
        tags?: {
            slug: string;
            label: string;
            category: string;
        }[] | undefined;
        imageUrl?: string | null | undefined;
        mediaAssets?: {
            url: string;
            kind: string;
            sortIndex?: number | null | undefined;
        }[] | undefined;
        sectionId?: string | null | undefined;
    }[];
    total: number;
    page: number;
    limit: number;
}>;
export declare const ItemQuerySchema: z.ZodEffects<z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, z.ZodTypeAny, "passthrough">>, {
    page: number;
    limit: number;
    filters: {};
    orderBy: {
        createdAt: string;
    };
}, z.objectInputType<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, z.ZodTypeAny, "passthrough">>;
export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemInputSchema>;
export type ItemResponse = z.infer<typeof ItemResponseSchema>;
export type ItemListResponse = z.infer<typeof ItemListResponseSchema>;
export type ItemQuery = z.infer<typeof ItemQuerySchema>;
//# sourceMappingURL=item.dto.d.ts.map