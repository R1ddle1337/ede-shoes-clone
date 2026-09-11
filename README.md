# Ede — Maison de Artisan · BigCommerce Stencil theme

This repository contains a BigCommerce Stencil theme that reproduces the Ede Shoes storefront structure, content routes, product presentation, cart and checkout integration supplied by BigCommerce.

## Source fidelity

`data/ede-catalog.json` and `data/ede-pages.json` are snapshots generated from the public Ede pages. The importer keeps the source product names, descriptions, prices and image URLs; it does not invent fallback catalog data. Run the crawler only with the store owner's authorization and follow the source site's terms and crawl delay.

## Local preview

```bash
npm ci
npx stencil start
```

Upload the theme with `npx stencil push` after adding your BigCommerce store credentials. Configure the store's navigation to use the original slugs (`women-shoes`, `mens-shoes`, `dropshipping-program`, `wholesale-program`, `our-atelier`, `process`, `apply-for-wholesale`) and enable the built-in BigCommerce checkout.

## Catalog import

1. `python scripts/crawl-ede-catalog.py` refreshes the source snapshot.
2. Create the Women and Men categories in BigCommerce and note their IDs.
3. Run:

```bash
BC_STORE_HASH=... BC_ACCESS_TOKEN=... \
BC_WOMEN_CATEGORY_ID=... BC_MEN_CATEGORY_ID=... \
node scripts/import-bigcommerce.mjs
```

The script creates products and attaches the original image URLs. Product options, inventory, tax and payment settings remain controlled by BigCommerce, so real checkout uses the store's configured providers.

## SEO and social metadata

The base layout emits canonical metadata supplied by BigCommerce plus Open Graph and Twitter card tags. Product pages use the product's primary image; page titles and descriptions come from the imported source fields. Submit the generated sitemap from the BigCommerce control panel after publishing.
