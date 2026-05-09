"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemAnalyticsRoutes = itemAnalyticsRoutes;
var db_1 = require("@packages/db");
var client_1 = require("@packages/db/generated/client");
var zod_1 = require("zod");
var auth_js_1 = require("../middleware/auth.js");
var rbac_1 = require("../middleware/rbac");
var QuerySchema = zod_1.z.object({
    storeId: zod_1.z.string().uuid(),
    period: zod_1.z.enum(['7d', '30d', '90d', 'all']).default('30d'),
    sortBy: zod_1.z
        .enum(['revenue', 'unitsSold', 'orders', 'lastSale', 'title', 'price'])
        .default('revenue'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    limit: zod_1.z.coerce.number().min(1).max(100).default(50),
    offset: zod_1.z.coerce.number().min(0).default(0),
});
function periodCutoff(period) {
    var now = new Date();
    switch (period) {
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
            return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case 'all':
            return undefined;
    }
}
function inPeriodSql(dateFilter) {
    if (!dateFilter)
        return client_1.Prisma.sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["TRUE"], ["TRUE"])));
    return client_1.Prisma.sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["(o.createdAt IS NOT NULL AND o.createdAt >= ", ")"], ["(o.createdAt IS NOT NULL AND o.createdAt >= ", ")"])), dateFilter);
}
function orderBySql(sortBy, sortOrder) {
    var col = sortBy === 'revenue'
        ? 'periodRevenue'
        : sortBy === 'unitsSold'
            ? 'periodUnitsSold'
            : sortBy === 'orders'
                ? 'periodOrderCount'
                : sortBy === 'lastSale'
                    ? 'lastSale'
                    : sortBy === 'title'
                        ? 'title'
                        : 'price';
    var dir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    return client_1.Prisma.sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["ORDER BY ", " ", ""], ["ORDER BY ", " ", ""])), client_1.Prisma.raw("`".concat(col, "`")), client_1.Prisma.raw(dir));
}
/** Registered before `/items/:id` so `analytics` is never captured as an id param. */
function handleItemAnalytics(request, reply) {
    return __awaiter(this, void 0, void 0, function () {
        var query, storeId, period, sortBy, sortOrder, limit, offset, dateFilter, pred, analytics, summary, error_1, message;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    _o.trys.push([0, 3, , 4]);
                    query = QuerySchema.parse(request.query);
                    storeId = query.storeId, period = query.period, sortBy = query.sortBy, sortOrder = query.sortOrder, limit = query.limit, offset = query.offset;
                    dateFilter = periodCutoff(period);
                    pred = inPeriodSql(dateFilter);
                    return [4 /*yield*/, db_1.prisma.$queryRaw(client_1.Prisma.sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n      SELECT\n        i.id AS itemId,\n        i.title,\n        i.description,\n        i.price,\n        (\n          SELECT m.url\n          FROM MediaAsset m\n          WHERE m.itemId = i.id AND m.kind = 'IMAGE'\n          ORDER BY m.sortIndex ASC, m.createdAt ASC\n          LIMIT 1\n        ) AS imageUrl,\n        i.isActive,\n        i.isSoldOut,\n        COALESCE(SUM(oi.quantity), 0) AS unitsSold,\n        COALESCE(SUM(oi.unitPrice * oi.quantity), 0) AS revenue,\n        COALESCE(COUNT(DISTINCT oi.orderId), 0) AS orderCount,\n        MAX(o.createdAt) AS lastSale,\n        CASE\n          WHEN COUNT(DISTINCT oi.orderId) > 0\n          THEN COALESCE(SUM(oi.unitPrice * oi.quantity), 0) / COUNT(DISTINCT oi.orderId)\n          ELSE 0\n        END AS avgOrderValue,\n        COALESCE(SUM(CASE WHEN ", " THEN oi.quantity ELSE 0 END), 0) AS periodUnitsSold,\n        COALESCE(SUM(CASE WHEN ", " THEN oi.unitPrice * oi.quantity ELSE 0 END), 0) AS periodRevenue,\n        COALESCE(COUNT(DISTINCT CASE WHEN ", " THEN oi.orderId END), 0) AS periodOrderCount,\n        'stable' AS trend\n      FROM Item i\n      LEFT JOIN OrderItem oi ON i.id = oi.itemId\n      LEFT JOIN `Order` o ON oi.orderId = o.id AND o.status != 'CANCELED'\n      WHERE i.storeId = ", "\n      GROUP BY i.id, i.title, i.description, i.price, i.isActive, i.isSoldOut\n      HAVING COALESCE(SUM(oi.quantity), 0) > 0 OR i.isActive = TRUE\n      ", "\n      LIMIT ", " OFFSET ", "\n    "], ["\n      SELECT\n        i.id AS itemId,\n        i.title,\n        i.description,\n        i.price,\n        (\n          SELECT m.url\n          FROM MediaAsset m\n          WHERE m.itemId = i.id AND m.kind = 'IMAGE'\n          ORDER BY m.sortIndex ASC, m.createdAt ASC\n          LIMIT 1\n        ) AS imageUrl,\n        i.isActive,\n        i.isSoldOut,\n        COALESCE(SUM(oi.quantity), 0) AS unitsSold,\n        COALESCE(SUM(oi.unitPrice * oi.quantity), 0) AS revenue,\n        COALESCE(COUNT(DISTINCT oi.orderId), 0) AS orderCount,\n        MAX(o.createdAt) AS lastSale,\n        CASE\n          WHEN COUNT(DISTINCT oi.orderId) > 0\n          THEN COALESCE(SUM(oi.unitPrice * oi.quantity), 0) / COUNT(DISTINCT oi.orderId)\n          ELSE 0\n        END AS avgOrderValue,\n        COALESCE(SUM(CASE WHEN ", " THEN oi.quantity ELSE 0 END), 0) AS periodUnitsSold,\n        COALESCE(SUM(CASE WHEN ", " THEN oi.unitPrice * oi.quantity ELSE 0 END), 0) AS periodRevenue,\n        COALESCE(COUNT(DISTINCT CASE WHEN ", " THEN oi.orderId END), 0) AS periodOrderCount,\n        'stable' AS trend\n      FROM Item i\n      LEFT JOIN OrderItem oi ON i.id = oi.itemId\n      LEFT JOIN \\`Order\\` o ON oi.orderId = o.id AND o.status != 'CANCELED'\n      WHERE i.storeId = ", "\n      GROUP BY i.id, i.title, i.description, i.price, i.isActive, i.isSoldOut\n      HAVING COALESCE(SUM(oi.quantity), 0) > 0 OR i.isActive = TRUE\n      ", "\n      LIMIT ", " OFFSET ", "\n    "])), pred, pred, pred, storeId, orderBySql(sortBy, sortOrder), limit, offset))];
                case 1:
                    analytics = _o.sent();
                    return [4 /*yield*/, db_1.prisma.$queryRaw(client_1.Prisma.sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n      SELECT\n        COUNT(DISTINCT i.id) AS totalItems,\n        COUNT(DISTINCT CASE WHEN i.isActive = true AND i.isSoldOut = false THEN i.id END) AS activeItems,\n        COALESCE(SUM(oi.quantity), 0) AS totalUnitsSold,\n        COALESCE(SUM(oi.unitPrice * oi.quantity), 0) AS totalRevenue,\n        COALESCE(COUNT(DISTINCT oi.orderId), 0) AS totalOrders,\n        CASE\n          WHEN COUNT(DISTINCT oi.orderId) > 0\n          THEN COALESCE(SUM(oi.unitPrice * oi.quantity), 0) / COUNT(DISTINCT oi.orderId)\n          ELSE 0\n        END AS avgOrderValue\n      FROM Item i\n      LEFT JOIN OrderItem oi ON i.id = oi.itemId\n      LEFT JOIN `Order` o ON oi.orderId = o.id AND o.status != 'CANCELED'\n      WHERE i.storeId = ", "\n    "], ["\n      SELECT\n        COUNT(DISTINCT i.id) AS totalItems,\n        COUNT(DISTINCT CASE WHEN i.isActive = true AND i.isSoldOut = false THEN i.id END) AS activeItems,\n        COALESCE(SUM(oi.quantity), 0) AS totalUnitsSold,\n        COALESCE(SUM(oi.unitPrice * oi.quantity), 0) AS totalRevenue,\n        COALESCE(COUNT(DISTINCT oi.orderId), 0) AS totalOrders,\n        CASE\n          WHEN COUNT(DISTINCT oi.orderId) > 0\n          THEN COALESCE(SUM(oi.unitPrice * oi.quantity), 0) / COUNT(DISTINCT oi.orderId)\n          ELSE 0\n        END AS avgOrderValue\n      FROM Item i\n      LEFT JOIN OrderItem oi ON i.id = oi.itemId\n      LEFT JOIN \\`Order\\` o ON oi.orderId = o.id AND o.status != 'CANCELED'\n      WHERE i.storeId = ", "\n    "])), storeId))];
                case 2:
                    summary = _o.sent();
                    return [2 /*return*/, reply.send({
                            success: true,
                            data: {
                                items: analytics.map(function (item) { return (__assign(__assign({}, item), { price: Number(item.price), unitsSold: Number(item.unitsSold), revenue: Number(item.revenue), orderCount: Number(item.orderCount), avgOrderValue: Number(item.avgOrderValue), periodUnitsSold: Number(item.periodUnitsSold), periodRevenue: Number(item.periodRevenue), periodOrderCount: Number(item.periodOrderCount), trend: item.trend === 'up' || item.trend === 'down' ? item.trend : 'stable' })); }),
                                summary: {
                                    totalItems: Number((_b = (_a = summary[0]) === null || _a === void 0 ? void 0 : _a.totalItems) !== null && _b !== void 0 ? _b : 0),
                                    activeItems: Number((_d = (_c = summary[0]) === null || _c === void 0 ? void 0 : _c.activeItems) !== null && _d !== void 0 ? _d : 0),
                                    totalUnitsSold: Number((_f = (_e = summary[0]) === null || _e === void 0 ? void 0 : _e.totalUnitsSold) !== null && _f !== void 0 ? _f : 0),
                                    totalRevenue: Number((_h = (_g = summary[0]) === null || _g === void 0 ? void 0 : _g.totalRevenue) !== null && _h !== void 0 ? _h : 0),
                                    totalOrders: Number((_k = (_j = summary[0]) === null || _j === void 0 ? void 0 : _j.totalOrders) !== null && _k !== void 0 ? _k : 0),
                                    avgOrderValue: Number((_m = (_l = summary[0]) === null || _l === void 0 ? void 0 : _l.avgOrderValue) !== null && _m !== void 0 ? _m : 0),
                                },
                                meta: {
                                    period: period,
                                    sortBy: sortBy,
                                    sortOrder: sortOrder,
                                    limit: limit,
                                    offset: offset,
                                    hasMore: analytics.length === limit,
                                },
                            },
                        })];
                case 3:
                    error_1 = _o.sent();
                    request.log.error({ err: error_1 }, 'Item analytics failed');
                    message = error_1 instanceof Error ? error_1.message : 'Unknown error';
                    return [2 /*return*/, reply.status(500).send({
                            success: false,
                            error: 'Failed to fetch item analytics',
                            // Always include a message in dev/local to unblock debugging.
                            // If you want to hide details in production, gate it at the API gateway / edge.
                            detail: message,
                        })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function itemAnalyticsRoutes(app) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            app.get('/api/items/analytics', {
                preHandler: [auth_js_1.authenticate, (0, rbac_1.requireRole)(['USER', 'VENDOR', 'ADMIN', 'STAFF'])],
            }, handleItemAnalytics);
            app.log.info({
                routes: ['/api/items/analytics'],
            }, 'Item analytics routes registered');
            return [2 /*return*/];
        });
    });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
