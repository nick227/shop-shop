import { z } from 'zod';
export declare const CreateBundleInputSchema: z.ZodObject<{
    storeId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    sortIndex: z.ZodOptional<z.ZodNumber>;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        quantity: z.ZodNumber;
        sortIndex: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        itemId: string;
        quantity: number;
        sortIndex?: number | undefined;
    }, {
        itemId: string;
        quantity: number;
        sortIndex?: number | undefined;
    }>, "many">;
    pricing: z.ZodObject<{
        pricingType: z.ZodEnum<["FIXED_PRICE", "DISCOUNT_PERCENT", "DISCOUNT_AMOUNT", "BEST_DEAL"]>;
        fixedPrice: z.ZodOptional<z.ZodNumber>;
        discountPercent: z.ZodOptional<z.ZodNumber>;
        discountAmount: z.ZodOptional<z.ZodNumber>;
        minSavings: z.ZodOptional<z.ZodNumber>;
        showSavings: z.ZodOptional<z.ZodBoolean>;
        savingsLabel: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    }, {
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    items: {
        itemId: string;
        quantity: number;
        sortIndex?: number | undefined;
    }[];
    name: string;
    storeId: string;
    pricing: {
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    };
    description?: string | undefined;
    isActive?: boolean | undefined;
    sortIndex?: number | undefined;
}, {
    items: {
        itemId: string;
        quantity: number;
        sortIndex?: number | undefined;
    }[];
    name: string;
    storeId: string;
    pricing: {
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    };
    description?: string | undefined;
    isActive?: boolean | undefined;
    sortIndex?: number | undefined;
}>;
export declare const UpdateBundleInputSchema: z.ZodEffects<z.ZodObject<{
    storeId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    sortIndex: z.ZodOptional<z.ZodNumber>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        quantity: z.ZodNumber;
        sortIndex: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        itemId: string;
        quantity: number;
        sortIndex?: number | undefined;
    }, {
        itemId: string;
        quantity: number;
        sortIndex?: number | undefined;
    }>, "many">>;
    pricing: z.ZodOptional<z.ZodObject<{
        pricingType: z.ZodEnum<["FIXED_PRICE", "DISCOUNT_PERCENT", "DISCOUNT_AMOUNT", "BEST_DEAL"]>;
        fixedPrice: z.ZodOptional<z.ZodNumber>;
        discountPercent: z.ZodOptional<z.ZodNumber>;
        discountAmount: z.ZodOptional<z.ZodNumber>;
        minSavings: z.ZodOptional<z.ZodNumber>;
        showSavings: z.ZodOptional<z.ZodBoolean>;
        savingsLabel: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    }, {
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    items?: {
        itemId: string;
        quantity: number;
        sortIndex?: number | undefined;
    }[] | undefined;
    description?: string | undefined;
    name?: string | undefined;
    storeId?: string | undefined;
    isActive?: boolean | undefined;
    sortIndex?: number | undefined;
    pricing?: {
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    } | undefined;
}, {
    items?: {
        itemId: string;
        quantity: number;
        sortIndex?: number | undefined;
    }[] | undefined;
    description?: string | undefined;
    name?: string | undefined;
    storeId?: string | undefined;
    isActive?: boolean | undefined;
    sortIndex?: number | undefined;
    pricing?: {
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    } | undefined;
}>, {
    items?: {
        itemId: string;
        quantity: number;
        sortIndex?: number | undefined;
    }[] | undefined;
    description?: string | undefined;
    name?: string | undefined;
    storeId?: string | undefined;
    isActive?: boolean | undefined;
    sortIndex?: number | undefined;
    pricing?: {
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    } | undefined;
}, {
    items?: {
        itemId: string;
        quantity: number;
        sortIndex?: number | undefined;
    }[] | undefined;
    description?: string | undefined;
    name?: string | undefined;
    storeId?: string | undefined;
    isActive?: boolean | undefined;
    sortIndex?: number | undefined;
    pricing?: {
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    } | undefined;
}>;
export declare const BundleResponseSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    storeId: z.ZodString;
    store: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    sortIndex: z.ZodOptional<z.ZodNumber>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        bundleId: z.ZodString;
        itemId: z.ZodString;
        quantity: z.ZodNumber;
        sortIndex: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
        title: z.ZodOptional<z.ZodString>;
        item: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            price: z.ZodNumber;
            imageUrl: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            id: string;
            price: number;
            imageUrl?: string | undefined;
        }, {
            title: string;
            id: string;
            price: number;
            imageUrl?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        itemId: string;
        bundleId: string;
        quantity: number;
        title?: string | undefined;
        item?: {
            title: string;
            id: string;
            price: number;
            imageUrl?: string | undefined;
        } | undefined;
        price?: number | undefined;
        sortIndex?: number | undefined;
    }, {
        id: string;
        itemId: string;
        bundleId: string;
        quantity: number;
        title?: string | undefined;
        item?: {
            title: string;
            id: string;
            price: number;
            imageUrl?: string | undefined;
        } | undefined;
        price?: number | undefined;
        sortIndex?: number | undefined;
    }>, "many">>;
    pricing: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        bundleId: z.ZodString;
        pricingType: z.ZodEnum<["FIXED_PRICE", "DISCOUNT_PERCENT", "DISCOUNT_AMOUNT", "BEST_DEAL"]>;
        fixedPrice: z.ZodOptional<z.ZodNumber>;
        discountPercent: z.ZodOptional<z.ZodNumber>;
        discountAmount: z.ZodOptional<z.ZodNumber>;
        minSavings: z.ZodOptional<z.ZodNumber>;
        showSavings: z.ZodOptional<z.ZodBoolean>;
        savingsLabel: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        bundleId: string;
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    }, {
        id: string;
        bundleId: string;
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    }>>;
    orderItems: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    storeId: string;
    items?: {
        id: string;
        itemId: string;
        bundleId: string;
        quantity: number;
        title?: string | undefined;
        item?: {
            title: string;
            id: string;
            price: number;
            imageUrl?: string | undefined;
        } | undefined;
        price?: number | undefined;
        sortIndex?: number | undefined;
    }[] | undefined;
    description?: string | undefined;
    store?: string | undefined;
    isActive?: boolean | undefined;
    sortIndex?: number | undefined;
    orderItems?: string | undefined;
    pricing?: {
        id: string;
        bundleId: string;
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    } | undefined;
}, {
    name: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    storeId: string;
    items?: {
        id: string;
        itemId: string;
        bundleId: string;
        quantity: number;
        title?: string | undefined;
        item?: {
            title: string;
            id: string;
            price: number;
            imageUrl?: string | undefined;
        } | undefined;
        price?: number | undefined;
        sortIndex?: number | undefined;
    }[] | undefined;
    description?: string | undefined;
    store?: string | undefined;
    isActive?: boolean | undefined;
    sortIndex?: number | undefined;
    orderItems?: string | undefined;
    pricing?: {
        id: string;
        bundleId: string;
        pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
        discountAmount?: number | undefined;
        fixedPrice?: number | undefined;
        discountPercent?: number | undefined;
        minSavings?: number | undefined;
        showSavings?: boolean | undefined;
        savingsLabel?: string | undefined;
    } | undefined;
}>;
export declare const BundleListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        storeId: z.ZodString;
        store: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        sortIndex: z.ZodOptional<z.ZodNumber>;
        items: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            bundleId: z.ZodString;
            itemId: z.ZodString;
            quantity: z.ZodNumber;
            sortIndex: z.ZodOptional<z.ZodNumber>;
            price: z.ZodOptional<z.ZodNumber>;
            title: z.ZodOptional<z.ZodString>;
            item: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                title: z.ZodString;
                price: z.ZodNumber;
                imageUrl: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                title: string;
                id: string;
                price: number;
                imageUrl?: string | undefined;
            }, {
                title: string;
                id: string;
                price: number;
                imageUrl?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            itemId: string;
            bundleId: string;
            quantity: number;
            title?: string | undefined;
            item?: {
                title: string;
                id: string;
                price: number;
                imageUrl?: string | undefined;
            } | undefined;
            price?: number | undefined;
            sortIndex?: number | undefined;
        }, {
            id: string;
            itemId: string;
            bundleId: string;
            quantity: number;
            title?: string | undefined;
            item?: {
                title: string;
                id: string;
                price: number;
                imageUrl?: string | undefined;
            } | undefined;
            price?: number | undefined;
            sortIndex?: number | undefined;
        }>, "many">>;
        pricing: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            bundleId: z.ZodString;
            pricingType: z.ZodEnum<["FIXED_PRICE", "DISCOUNT_PERCENT", "DISCOUNT_AMOUNT", "BEST_DEAL"]>;
            fixedPrice: z.ZodOptional<z.ZodNumber>;
            discountPercent: z.ZodOptional<z.ZodNumber>;
            discountAmount: z.ZodOptional<z.ZodNumber>;
            minSavings: z.ZodOptional<z.ZodNumber>;
            showSavings: z.ZodOptional<z.ZodBoolean>;
            savingsLabel: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            bundleId: string;
            pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
            discountAmount?: number | undefined;
            fixedPrice?: number | undefined;
            discountPercent?: number | undefined;
            minSavings?: number | undefined;
            showSavings?: boolean | undefined;
            savingsLabel?: string | undefined;
        }, {
            id: string;
            bundleId: string;
            pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
            discountAmount?: number | undefined;
            fixedPrice?: number | undefined;
            discountPercent?: number | undefined;
            minSavings?: number | undefined;
            showSavings?: boolean | undefined;
            savingsLabel?: string | undefined;
        }>>;
        orderItems: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        storeId: string;
        items?: {
            id: string;
            itemId: string;
            bundleId: string;
            quantity: number;
            title?: string | undefined;
            item?: {
                title: string;
                id: string;
                price: number;
                imageUrl?: string | undefined;
            } | undefined;
            price?: number | undefined;
            sortIndex?: number | undefined;
        }[] | undefined;
        description?: string | undefined;
        store?: string | undefined;
        isActive?: boolean | undefined;
        sortIndex?: number | undefined;
        orderItems?: string | undefined;
        pricing?: {
            id: string;
            bundleId: string;
            pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
            discountAmount?: number | undefined;
            fixedPrice?: number | undefined;
            discountPercent?: number | undefined;
            minSavings?: number | undefined;
            showSavings?: boolean | undefined;
            savingsLabel?: string | undefined;
        } | undefined;
    }, {
        name: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        storeId: string;
        items?: {
            id: string;
            itemId: string;
            bundleId: string;
            quantity: number;
            title?: string | undefined;
            item?: {
                title: string;
                id: string;
                price: number;
                imageUrl?: string | undefined;
            } | undefined;
            price?: number | undefined;
            sortIndex?: number | undefined;
        }[] | undefined;
        description?: string | undefined;
        store?: string | undefined;
        isActive?: boolean | undefined;
        sortIndex?: number | undefined;
        orderItems?: string | undefined;
        pricing?: {
            id: string;
            bundleId: string;
            pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
            discountAmount?: number | undefined;
            fixedPrice?: number | undefined;
            discountPercent?: number | undefined;
            minSavings?: number | undefined;
            showSavings?: boolean | undefined;
            savingsLabel?: string | undefined;
        } | undefined;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    data: {
        name: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        storeId: string;
        items?: {
            id: string;
            itemId: string;
            bundleId: string;
            quantity: number;
            title?: string | undefined;
            item?: {
                title: string;
                id: string;
                price: number;
                imageUrl?: string | undefined;
            } | undefined;
            price?: number | undefined;
            sortIndex?: number | undefined;
        }[] | undefined;
        description?: string | undefined;
        store?: string | undefined;
        isActive?: boolean | undefined;
        sortIndex?: number | undefined;
        orderItems?: string | undefined;
        pricing?: {
            id: string;
            bundleId: string;
            pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
            discountAmount?: number | undefined;
            fixedPrice?: number | undefined;
            discountPercent?: number | undefined;
            minSavings?: number | undefined;
            showSavings?: boolean | undefined;
            savingsLabel?: string | undefined;
        } | undefined;
    }[];
    page: number;
    limit: number;
}, {
    total: number;
    data: {
        name: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        storeId: string;
        items?: {
            id: string;
            itemId: string;
            bundleId: string;
            quantity: number;
            title?: string | undefined;
            item?: {
                title: string;
                id: string;
                price: number;
                imageUrl?: string | undefined;
            } | undefined;
            price?: number | undefined;
            sortIndex?: number | undefined;
        }[] | undefined;
        description?: string | undefined;
        store?: string | undefined;
        isActive?: boolean | undefined;
        sortIndex?: number | undefined;
        orderItems?: string | undefined;
        pricing?: {
            id: string;
            bundleId: string;
            pricingType: "FIXED_PRICE" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT" | "BEST_DEAL";
            discountAmount?: number | undefined;
            fixedPrice?: number | undefined;
            discountPercent?: number | undefined;
            minSavings?: number | undefined;
            showSavings?: boolean | undefined;
            savingsLabel?: string | undefined;
        } | undefined;
    }[];
    page: number;
    limit: number;
}>;
export declare const BundleQuerySchema: z.ZodEffects<z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    storeId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodEffects<z.ZodOptional<z.ZodString>, boolean | undefined, string | undefined>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    storeId?: string | undefined;
    isActive?: boolean | undefined;
}, {
    storeId?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    isActive?: string | undefined;
}>, {
    page: number;
    limit: number;
    filters: {
        isActive?: boolean | undefined;
        storeId?: string | undefined;
    };
    orderBy: {
        sortIndex: string;
    };
}, {
    storeId?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    isActive?: string | undefined;
}>;
export type CreateBundleInput = z.infer<typeof CreateBundleInputSchema>;
export type UpdateBundleInput = z.infer<typeof UpdateBundleInputSchema>;
export type BundleResponse = z.infer<typeof BundleResponseSchema>;
export type BundleListResponse = z.infer<typeof BundleListResponseSchema>;
export type BundleQuery = z.infer<typeof BundleQuerySchema>;
export type BundlePricingType = 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL';
//# sourceMappingURL=bundle.dto.d.ts.map