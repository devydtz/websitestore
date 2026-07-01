import { json } from "./_shared";

export const onRequestGet: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;

  return json({
    openapi: "3.0.3",
    info: {
      title: "Lunaris Copilot API",
      version: "1.0.0",
      description:
        "Private read-only Microsoft Copilot integration for Lunaris Craft admin data. This API exposes summary, orders, products, accounts, promo codes, and cross-table search.",
    },
    servers: [
      {
        url: origin,
        description: "Lunaris production origin",
      },
    ],
    components: {
      securitySchemes: {
        LunarisCopilotKey: {
          type: "apiKey",
          in: "header",
          name: "X-Lunaris-Copilot-Key",
          description: "Private API key registered in Microsoft Copilot for your organization.",
        },
      },
    },
    security: [{ LunarisCopilotKey: [] }],
    paths: {
      "/api/copilot/status": {
        get: {
          operationId: "getLunarisStatus",
          summary: "Check Lunaris Copilot API status",
          description: "Returns whether the private Lunaris Copilot API is configured and reachable.",
          responses: {
            "200": { description: "Status response" },
          },
        },
      },
      "/api/copilot/summary": {
        get: {
          operationId: "getLunarisSummary",
          summary: "Get Lunaris store summary",
          description:
            "Returns top-level counts for orders, products, accounts, and promo codes. Use this for dashboard-style admin questions.",
          responses: {
            "200": { description: "Summary response" },
          },
        },
      },
      "/api/copilot/orders": {
        get: {
          operationId: "getLunarisOrders",
          summary: "Get Lunaris orders",
          description:
            "Returns recent Lunaris orders. Filter by status or username when answering admin questions about order flow.",
          parameters: [
            { name: "status", in: "query", schema: { type: "string" }, description: "Optional order status filter." },
            { name: "username", in: "query", schema: { type: "string" }, description: "Optional username filter." },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 25 } },
          ],
          responses: {
            "200": { description: "Orders response" },
          },
        },
      },
      "/api/copilot/products": {
        get: {
          operationId: "getLunarisProducts",
          summary: "Get Lunaris products",
          description:
            "Returns ranks, keys, bundles, cosmetics, and other store products from store_products. Filter by category or active state.",
          parameters: [
            { name: "category", in: "query", schema: { type: "string" }, description: "Optional product category filter." },
            { name: "active", in: "query", schema: { type: "boolean" }, description: "Optional active-state filter." },
            { name: "featured", in: "query", schema: { type: "boolean" }, description: "Optional featured-state filter." },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 250, default: 100 } },
          ],
          responses: {
            "200": { description: "Products response" },
          },
        },
      },
      "/api/copilot/accounts": {
        get: {
          operationId: "getLunarisAccounts",
          summary: "Get Lunaris accounts",
          description:
            "Returns Lunaris customer accounts, including verification and disabled status, spending, and last-seen data.",
          parameters: [
            { name: "username", in: "query", schema: { type: "string" }, description: "Optional username filter." },
            { name: "verified", in: "query", schema: { type: "boolean" }, description: "Optional email verification filter." },
            { name: "disabled", in: "query", schema: { type: "boolean" }, description: "Optional disabled-state filter." },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 250, default: 50 } },
          ],
          responses: {
            "200": { description: "Accounts response" },
          },
        },
      },
      "/api/copilot/promos": {
        get: {
          operationId: "getLunarisPromos",
          summary: "Get Lunaris promo codes",
          description: "Returns Lunaris promo codes, usage limits, active state, and expiry data.",
          parameters: [
            { name: "active", in: "query", schema: { type: "boolean" }, description: "Optional active-state filter." },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 250, default: 100 } },
          ],
          responses: {
            "200": { description: "Promo response" },
          },
        },
      },
      "/api/copilot/search": {
        get: {
          operationId: "searchLunarisData",
          summary: "Search Lunaris data",
          description:
            "Searches orders, accounts, products, and promo codes together. Use for broad admin lookups across the Lunaris system.",
          parameters: [
            { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Search text." },
          ],
          responses: {
            "200": { description: "Search response" },
          },
        },
      },
    },
  });
};

export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  return json({ error: "Method not allowed." }, { status: 405 });
};
