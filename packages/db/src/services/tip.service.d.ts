export declare const setTipServiceBroadcast: (fn: (topic: string, event: any) => void) => void;
export interface CreateTipInput {
    orderId: string;
    amount: number;
    userId: string;
}
export interface ProcessTipInput {
    tipId: string;
    paymentMethodId: string;
    userId: string;
}
export interface TipResult {
    id: string;
    orderId: string;
    amount: number;
    status: string;
    stripePaymentIntentId?: string;
    clientSecret?: string;
}
export declare const createTip: (input: CreateTipInput) => Promise<TipResult>;
export declare const processTip: (input: ProcessTipInput) => Promise<TipResult>;
export declare const getTip: (tipId: string, userId: string) => Promise<TipResult>;
export declare const refundTip: (tipId: string, userId: string) => Promise<TipResult>;
//# sourceMappingURL=tip.service.d.ts.map