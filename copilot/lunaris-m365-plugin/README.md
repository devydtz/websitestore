# Lunaris Microsoft Copilot Plugin Setup

This folder gives you the Microsoft-side package starter for connecting your organization's Microsoft Copilot to Lunaris Craft data.

## What this integration does

It lets Microsoft Copilot query private Lunaris admin data through a secure, read-only API:

- store summary
- orders
- products
- accounts
- promo codes
- cross-table search

## What this integration does not do

- It does not expose your Supabase service role key to the browser.
- It does not make Lunaris data public.
- It does not grant write access by default.

## Before Microsoft setup

In Cloudflare Pages / Functions, add these server variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `COPILOT_LUNARIS_API_KEY`

Do not put the service-role key in frontend env vars.

## API endpoint

The OpenAPI description is served by your site here:

`https://mclunaris.store/api/copilot/openapi.json`

## Microsoft setup flow

This follows Microsoft's API plugin path for Microsoft 365 Copilot:

1. Open Teams Developer Portal.
2. Go to `Tools` -> `API key registration`.
3. Create a new API key registration.
4. Add the same value you used for `COPILOT_LUNARIS_API_KEY`.
5. Set the base URL to:
   `https://mclunaris.store`
6. Copy the generated API key registration ID.
7. Open `plugin-manifest.template.json`.
8. Replace:
   `REPLACE_WITH_TEAMS_API_KEY_REGISTRATION_ID`
   with your real registration ID.
9. Upload/use the manifest through Microsoft 365 Agents Toolkit or your Copilot plugin flow.

## Notes

- The plugin manifest points to the live OpenAPI URL on your Lunaris site.
- If you use a different domain later, update the `spec.url` value.
- If you want write actions later, add separate protected endpoints and keep read-only endpoints as the default.

