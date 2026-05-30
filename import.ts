// import.ts
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import fetch from 'node-fetch';

import {
  bootstrap,
  RequestContext,
  ProductService,
  ProductVariantService,
  CollectionService,
  FacetValueService,
  FacetService,
  ChannelService,
  ProductOptionService,
  Logger,
  StockMovementService,
} from '@vendure/core';

import { LanguageCode } from '@vendure/common/lib/generated-types';
import { parse } from 'csv-parse/sync';
import { config as baseConfig } from './src/vendure-config';

// Cache for all product options with group relation loaded
let allOptionsWithGroups: Array<{
  id: string;
  code: string;
  groupCode: string | null;
}> = [];

async function loadAllOptionsWithGroups(ctx: RequestContext, service: ProductOptionService) {
  if (allOptionsWithGroups.length > 0) return;

  const paginated = await service.findAll(ctx);
  const allOptions = paginated.items;

  if (allOptions.length === 0) {
    Logger.info('No product options found in the database.');
    return;
  }

  const connection = (service as any).connection as import('@vendure/core').TransactionalConnection;

  const repo = connection.getRepository(ctx, 'ProductOption');
  const loaded = await repo.find({
    relations: ['group'],
  });

  allOptionsWithGroups = loaded.map((o: any) => ({
    id: String(o.id),
    code: o.code,
    groupCode: o.group?.code ?? null,
  }));

  Logger.info(`Pre-loaded ${allOptionsWithGroups.length} product options with group codes for import`);
}

async function findOptionIds(
  ctx: RequestContext,
  service: ProductOptionService,
  optionsString?: string,
): Promise<string[]> {
  await loadAllOptionsWithGroups(ctx, service);

  if (!optionsString) return [];

  const optionPairs = safeSplit(optionsString);
  const optionIds: string[] = [];

  for (const pair of optionPairs) {
    const parts = pair.split(':').map(s => s?.trim()).filter(Boolean);
    if (parts.length !== 2) {
      Logger.warn(`Invalid option format: "${pair}". Expected "groupCode:optionCode"`);
      continue;
    }
    const [groupCode, optionCode] = parts;

    const matchingOption = allOptionsWithGroups.find(
      opt => opt.code === optionCode && opt.groupCode === groupCode
    );

    if (matchingOption) {
      optionIds.push(matchingOption.id);
      Logger.info(`Resolved option: ${groupCode}:${optionCode} → ID ${matchingOption.id}`);
    } else {
      Logger.warn(
        `Could not find option with code "${optionCode}" in group "${groupCode}". ` +
        `Verify exact code spelling and case sensitivity.`
      );
    }
  }

  return optionIds;
}

const importConfig = {
  ...baseConfig,
  apiOptions: {
    ...baseConfig.apiOptions,
    port: 0,
    adminApiPath: baseConfig.apiOptions?.adminApiPath,
    shopApiPath: baseConfig.apiOptions?.shopApiPath,
  },
};

type CsvRow = {
  productId?: string;
  productName?: string;
  productSlug?: string;
  productDescription?: string;
  productAssets?: string;
  productFeaturedAsset?: string;
  productFacetValues?: string;
  variantSku?: string;
  variantName?: string;
  options?: string;
  variantPrice?: string;
  taxCategoryName?: string;
  variantAssets?: string;
  variantFeaturedAsset?: string;
  assets?: string;
  variantFacetValues?: string;
  collections?: string;
  channels?: string;
  stockLevels?: string;
};

const ASSETS_MAP_PATH = path.join(process.cwd(), 'assets-map.json');

function loadAssetsMap(): Record<string, number> {
  try {
    const raw = fs.readFileSync(ASSETS_MAP_PATH, 'utf8');
    return JSON.parse(raw) as Record<string, number>;
  } catch (err) {
    Logger.warn(`Could not read assets-map.json at ${ASSETS_MAP_PATH}: ${errMsg(err)}`);
    return {};
  }
}

// const updateProductMutation = `
//   mutation UpdateProduct($input: UpdateProductInput!) {
//     updateProduct(input: $input) {
//       id
//       assets { id preview name }
//       featuredAsset { id name preview }
//       facetValues { id code name }
//     }
//   }
// `;

const updateProductMutation = `
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      featuredAsset { id name preview }
      assets { id name }
      facetValues { id code name }
    }
  }
`;



const updateVariantMutation = `
  mutation UpdateVariant($input: UpdateProductVariantInput!) {
    updateProductVariant(input: $input) {
      id
      assets { id preview name }
      featuredAsset { id name preview }
    }
  }
`;

async function getAdminUrlAndToken(app: any) {
  const apiOptions = (importConfig as any)?.apiOptions ?? {};
  let hostname = apiOptions.hostname ?? '127.0.0.1';
  let port = apiOptions.port ?? 0;
  const adminPathRaw = apiOptions.adminApiPath ?? '/admin-api';
  const adminPath = adminPathRaw.startsWith('/') ? adminPathRaw : `/${adminPathRaw}`;

  try {
    const httpServer: any = (app as any).httpServer || (app as any).getHttpServer?.();
    const addr = httpServer?.address?.();
    if (addr && typeof addr === 'object') {
      if (addr.port && Number(addr.port) > 0) port = addr.port;
      if (addr.address) hostname = addr.address;
    }
  } catch (e) {
    Logger.warn(`Could not read http server address: ${errMsg(e)}`);
  }

  if (!hostname || hostname === '0.0.0.0' || hostname === '::' || hostname === '::1') {
    hostname = '127.0.0.1';
  }
  if (!port || port === 0) {
    throw new Error('Could not determine Admin API port. Set a fixed port in importConfig.apiOptions.port or ensure the server exposes the bound port.');
  }

  const adminUrl = `http://${hostname}:${port}${adminPath}`;

  const username = process.env.SUPERADMIN_USERNAME || (baseConfig as any)?.authOptions?.superadminCredentials?.identifier;
  const password = process.env.SUPERADMIN_PASSWORD || (baseConfig as any)?.authOptions?.superadminCredentials?.password;
  if (!username || !password) {
    throw new Error('SUPERADMIN_USERNAME / SUPERADMIN_PASSWORD not set');
  }

  const authResp = await fetch(adminUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation Authenticate($input: AuthenticationInput!) {
        authenticate(input: $input) { ... on CurrentUser { id } }
      }`,
      variables: { input: { native: { username, password } } },
    }),
  });

  const token = authResp.headers.get('vendure-auth-token');
  if (!token) {
    const body = await authResp.text().catch(() => '');
    throw new Error(`Failed to authenticate to Admin API. Response: ${body}`);
  }

  return { adminUrl, token };
}

async function graphqlAdmin(adminUrl: string, token: string, query: string, variables: any) {
  const resp = await fetch(adminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'vendure-auth-token': token,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await resp.text().catch(() => '');
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`GraphQL response not JSON: ${text}`);
  }

  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data;
}

async function createStockMovementViaAdminApi(
  app: any,
  ctx: RequestContext,
  variantId: string,
  targetStock: number
): Promise<boolean> {
  const { ADMIN_API_URL, ADMIN_API_USER, ADMIN_API_PASS } = process.env;

  if (!ADMIN_API_URL || !ADMIN_API_USER || !ADMIN_API_PASS) {
    Logger.warn('Missing env vars for Admin API stock update');
    return false;
  }

  try {
    const authResp = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation Auth($input: AuthenticationInput!) {
          authenticate(input: $input) { ... on CurrentUser { id } }
        }`,
        variables: {
          input: { native: { username: ADMIN_API_USER, password: ADMIN_API_PASS } }
        },
      }),
    });

    const token = authResp.headers.get('vendure-auth-token');
    if (!token) {
      Logger.warn('Failed to authenticate for stock update');
      return false;
    }

    const resp = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation UpdateVariantStock($input: [UpdateProductVariantInput!]!) {
            updateProductVariants(input: $input) {
              id
              sku
              stockOnHand
            }
          }
        `,
        variables: {
          input: [{
            id: variantId,
            stockOnHand: targetStock,
          }],
        },
      }),
    });

    const json = await resp.json();
    if (json.errors) {
      Logger.warn(`updateProductVariants error: ${JSON.stringify(json.errors)}`);
      return false;
    }

    const updated = json.data.updateProductVariants[0];
    Logger.info(`Stock set to ${updated.stockOnHand} for variant ${updated.sku} (ID ${updated.id})`);
    return true;
  } catch (err) {
    Logger.warn(`Admin API stock set failed: ${errMsg(err)}`);
    return false;
  }
}

function safeSplit(s?: string, sep = '|'): string[] {
  if (!s) return [];
  return s
    .split(sep)
    .map(t => t.trim())
    .filter(Boolean);
}

function errMsg(err: unknown): string {
  return (err as any)?.message ?? String(err ?? 'unknown error');
}

function parseStockToken(token?: string) {
  if (!token) return null;
  const t = token.trim();
  if (!t) return null;
  if (t.includes(':')) {
    const [left, right] = t.split(':').map(s => s.trim());
    const qty = Number(right);
    if (Number.isNaN(qty)) return null;
    return { selector: left, qty };
  }
  const qty = Number(t);
  if (Number.isNaN(qty)) return null;
  return { selector: undefined, qty };
}

async function setVariantStock(
  app: any,
  ctx: RequestContext,
  productVariantService: any,
  stockMovementService: any,
  variantId: string,
  targetQty: number,
): Promise<boolean> {
  if (!variantId) return false;

  let current = 0;
  try {
    const variant = await productVariantService.findOne(ctx, variantId);
    current = Number((variant as any)?.stockOnHand ?? 0) || 0;
  } catch (err) {
    Logger.warn(`Could not read current stock for variant ${variantId}: ${errMsg(err)}`);
  }

  const delta = targetQty - current;
  if (delta === 0) {
    Logger.info(`Stock already at ${targetQty} for variant ${variantId}; no movement needed.`);
    return true;
  }

  const movementInput: any = {
    productVariantId: variantId,
    type: 'ADJUSTMENT',
    quantity: delta,
    reason: 'import-initial',
  };

  try {
    if (typeof stockMovementService.create === 'function') {
      await stockMovementService.create(ctx, movementInput);
      return true;
    }
    if (typeof stockMovementService.adjustStock === 'function') {
      await stockMovementService.adjustStock(ctx, movementInput);
      return true;
    }
  } catch (e) {
    Logger.warn(`Service stock movement attempt failed: ${errMsg(e)}`);
  }

  Logger.info('Falling back to Admin API for stock update');
  return await createStockMovementViaAdminApi(app, ctx, variantId, targetQty);
}

// async function mergeAndUpdateProduct(
//   adminUrl: string,
//   adminToken: string,
//   productService: ProductService,
//   ctx: RequestContext,
//   productId: string,
//   newAssetIds: string[],
//   featuredAssetId?: string,
//   newFacetValueIds: string[] = [],
// ) {
//   try {
//     const prod = await productService.findOne(ctx, productId);
//     const existingAssetIds = (prod as any)?.assets?.map((a: any) => String(a.id)) ?? [];
//     const existingFacetIds = (prod as any)?.facetValues?.map((f: any) => String(f.id)) ?? [];

//     const mergedAssetSet = new Set<string>([...existingAssetIds, ...newAssetIds.map(String)]);
//     if (featuredAssetId) mergedAssetSet.add(String(featuredAssetId));
//     const mergedAssets = Array.from(mergedAssetSet);

//     const mergedFacetSet = new Set<string>([...existingFacetIds, ...newFacetValueIds.map(String)]);
//     const mergedFacets = Array.from(mergedFacetSet);

//     const input: any = { id: productId };
//     if (mergedAssets.length) input.assetIds = mergedAssets;
//     if (featuredAssetId) input.featuredAssetId = String(featuredAssetId);
//     if (mergedFacets.length) input.facetValueIds = mergedFacets;

//     const data = await graphqlAdmin(adminUrl, adminToken, updateProductMutation, { input });
//     return true;
//   } catch (err) {
//     Logger.warn(`Failed to merge/update product ${productId}: ${errMsg(err)}`);
//     return false;
//   }
// }

async function mergeAndUpdateProduct(
  adminUrl: string,
  adminToken: string,
  productService: ProductService,
  ctx: RequestContext,
  productId: string,
  newAssetIds: string[],
  featuredAssetId?: string,
  newFacetValueIds: string[] = [],
) {
  try {
    const prod = await productService.findOne(ctx, productId);
    const existingAssetIds = (prod as any)?.assets?.map((a: any) => String(a.id)) ?? [];
    const existingFacetIds = (prod as any)?.facetValues?.map((f: any) => String(f.id)) ?? [];

    const mergedAssetSet = new Set<string>([...existingAssetIds, ...newAssetIds.map(String)]);
    const mergedAssets = Array.from(mergedAssetSet);

    const mergedFacetSet = new Set<string>([...existingFacetIds, ...newFacetValueIds.map(String)]);
    const mergedFacets = Array.from(mergedFacetSet);

    const input: any = { id: productId };
    if (mergedAssets.length > 0) input.assetIds = mergedAssets;
    if (featuredAssetId) input.featuredAssetId = String(featuredAssetId);  // ← THIS LINE WAS MISSING OR NOT WORKING
    if (mergedFacets.length > 0) input.facetValueIds = mergedFacets;

    const data = await graphqlAdmin(adminUrl, adminToken, updateProductMutation, { input });
    Logger.info(`Product updated: featuredAssetId=${featuredAssetId || 'none'}, assets=${mergedAssets.length}, facets=${mergedFacets.length}`);
    return true;
  } catch (err) {
    Logger.warn(`Failed to merge/update product ${productId}: ${errMsg(err)}`);
    return false;
  }
}



async function mergeAndUpdateVariant(
  adminUrl: string,
  adminToken: string,
  productVariantService: ProductVariantService,
  ctx: RequestContext,
  variantId: string,
  newAssetIds: string[],
  featuredAssetId?: string,
) {
  try {
    const variant = await productVariantService.findOne(ctx, variantId);
    const existingIds = (variant as any)?.assets?.map((a: any) => String(a.id)) ?? [];
    const mergedSet = new Set<string>([...existingIds, ...newAssetIds.map(String)]);
    if (featuredAssetId) mergedSet.add(String(featuredAssetId));
    const merged = Array.from(mergedSet);
    const input: any = { id: variantId, assetIds: merged };
    if (featuredAssetId) input.featuredAssetId = String(featuredAssetId);

    const data = await graphqlAdmin(adminUrl, adminToken, updateVariantMutation, { input });
    return true;
  } catch (err) {
    Logger.warn(`Failed to merge/update variant ${variantId}: ${errMsg(err)}`);
    return false;
  }
}

function mapFilenamesToIds(assetsMap: Record<string, number>, filenames: string[]): string[] {
  return filenames.map(f => assetsMap[f]).filter(id => id != null).map(String);
}

async function runImport() {
  const app = await bootstrap(importConfig);

  const { adminUrl, token: adminToken } = await getAdminUrlAndToken(app);

  const ctx = new RequestContext({
    apiType: 'admin',
    channel: await (app.get(ChannelService)).getDefaultChannel(),
    // authorizedAsOwnerOnly: false,
  } as any);

  const productService: ProductService = app.get(ProductService);
  const productVariantService: ProductVariantService = app.get(ProductVariantService);
  const collectionService: CollectionService = app.get(CollectionService);
  const facetService: FacetService = app.get(FacetService);
  const facetValueService: FacetValueService = app.get(FacetValueService);
  const channelService: ChannelService = app.get(ChannelService);
  const productOptionService: ProductOptionService = app.get(ProductOptionService);
  const stockMovementService = app.get(StockMovementService);

  const assetsMap = loadAssetsMap();

  const csvPath = process.argv[2] || './import-01.csv';
  Logger.info(`Reading CSV file from: ${csvPath}`);

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  Logger.info(`Found ${records.length} rows to process...`);

  for (const row of records as any[]) {
    try {
      const sku = (row.variantSku || '').trim();
      const slug = (row.productSlug || '').trim();

      // if (!sku) {
      //   Logger.warn('Skipping row with no variantSku');
      //   continue;
      // }

      // Allow rows without SKU if they have productSlug (for product-level updates like featured asset)
      if (!sku && !slug) {
        Logger.warn('Skipping row with neither variantSku nor productSlug');
        continue;
      }

      Logger.info(`Product slug --> Processing variant with SKU: ${slug}`);
      Logger.info(`Variant sku --> Processing variant with SKU: ${sku}`);
      

      const variantFacetValueIds = await resolveFacetValueIds(ctx, facetService, facetValueService, row.variantFacetValues);
      const productFacetValueIds = await resolveFacetValueIds(ctx, facetService, facetValueService, row.productFacetValues);

      // Find product by slug
      let product: any | undefined;
      if (slug) {
        const products = await productService.findAll(ctx, { filter: { slug: { eq: slug } } });
        product = products?.items?.[0];
      }

      // Find variant by SKU
      const variants = await productVariantService.findAll(ctx, { filter: { sku: { eq: sku } } });
      const variant = variants?.items?.[0];

      let variantId: string | undefined;

      if (variant) {
        variantId = variant.id as string;
        Logger.info(`Variant with SKU ${sku} found. Updating...`);
      } 

      else {
        const productList = await productService.findAll(ctx, {
          filter: { slug: { eq: slug } },
        });
        const currentProduct = productList.items[0];

        if (!currentProduct) {
          throw new Error(`Product with slug "${slug}" not found when creating variant ${sku}`);
        }

        const optionIds = await findOptionIds(ctx, productOptionService, row.options);
        const stringOptionIds = optionIds.map(id => String(id));

        Logger.info(`Creating variant SKU "${sku}" for product "${currentProduct.name}" (ID ${currentProduct.id}) with optionIds: [${stringOptionIds.join(', ')}]`);

        const variantDisplayName = (row.variantName || row.productName || row.productSlug || `Variant ${sku}`).trim();
        const price = Number.isFinite(Number(row.variantPrice)) ? Math.round(Number(row.variantPrice) * 100) : undefined;

        const createVariantMutation = `
          mutation CreateProductVariants($input: [CreateProductVariantInput!]!) {
            createProductVariants(input: $input) {
              id
              sku
              name
            }
          }
        `;

        const variables = {
          input: [{
            productId: currentProduct.id,
            sku,
            price,
            optionIds: stringOptionIds,
            facetValueIds: variantFacetValueIds,
            translations: [{
              languageCode: LanguageCode.en,
              name: variantDisplayName,
            }],
          }]
        };

        try {
          const result = await graphqlAdmin(adminUrl, adminToken, createVariantMutation, variables);
          const createdVariant = result.createProductVariants[0];
          variantId = createdVariant.id;
          Logger.info(`Successfully created variant ${sku} with ID ${variantId} via GraphQL`);
        } catch (e: any) {
          throw new Error(`GraphQL variant creation failed: ${e.message}`);
        }
      }



      if (variantId) {
        Logger.info(`Variant id resolved: ${variantId} for SKU ${sku}`);
      } else {
        Logger.warn(`Could not resolve variant id for SKU ${sku}; stock/asset steps will be skipped for this row.`);
      }

      // Handle stockLevels from CSV
      const stockToken = (row.stockLevels || '').trim();
      const parsed = parseStockToken(stockToken);
      if (parsed) {
        const { selector, qty } = parsed;
        if (!selector) {
          if (variantId) {
            await setVariantStock(app, ctx, productVariantService, stockMovementService, variantId, qty);
          }
        } else {
          
            // selector provided: could be SKU or numeric index
            if (/^\d+$/.test(selector)) {
              // numeric index (1-based) within product variants
              try {
                const prod = product ?? (await productService.findAll(ctx, { filter: { slug: { eq: slug } } })).items?.[0];
                const idx = Number(selector) - 1;
                const targetVariant = prod?.variants?.[idx];
                if (targetVariant) {
                  await setVariantStock(app, ctx, productVariantService, stockMovementService, targetVariant.id as string, qty);
                } else {
                  Logger.warn(`Stock selector index ${selector} not found for product ${slug}`);
                }
              } catch (err) {
                // Logger.warn(`Error resolving numeric stock selector ${selector}: ${err?.message ?? err}`);
                Logger.warn(`Error resolving numeric stock selector ${selector}: ${errMsg(err)}`);
              }
            } else {
              // treat selector as SKU
              try {
                const found = await productVariantService.findAll(ctx, { filter: { sku: { eq: selector } } });
                const other = found?.items?.[0];
                if (other) {
                  await setVariantStock(app, ctx, productVariantService, stockMovementService, other.id as string, qty);
                } else {
                  Logger.warn(`Stock selector "${selector}" did not match any variant SKU`);
                }
              } catch (err) {
                // Logger.warn(`Error finding variant by SKU ${selector}: ${err?.message ?? err}`);
                Logger.warn(`Error finding variant by SKU ${selector}: ${errMsg(err)}`);
              }
            }
            // selector provided: could be SKU or numeric index

        }
      }

      // --- ASSETS ---
      const productFilenames = safeSplit(row.productAssets ?? '', '|');
      const productAssetIds = mapFilenamesToIds(assetsMap, productFilenames);

      const productFeaturedFilename = (row.productFeaturedAsset ?? '').trim();
      const productFeaturedId = productFeaturedFilename ? assetsMap[productFeaturedFilename] : undefined;

      if ((productAssetIds.length > 0 || productFeaturedId || productFacetValueIds.length > 0) && product && product.id) {
        await mergeAndUpdateProduct(
          adminUrl,
          adminToken,
          productService,
          ctx,
          String(product.id),
          productAssetIds,
          productFeaturedId ? String(productFeaturedId) : undefined,
          productFacetValueIds
        );
        Logger.info(`Product assets/featured/facets processed for product ${product.id}`);
      }

      const variantFilenames = safeSplit(row.variantAssets ?? '', '|');
      const variantAssetIds = mapFilenamesToIds(assetsMap, variantFilenames);

      const variantFeaturedFilename = (row.variantFeaturedAsset ?? '').trim();
      const variantFeaturedId = variantFeaturedFilename ? assetsMap[variantFeaturedFilename] : undefined;

      if ((variantAssetIds.length > 0 || variantFeaturedId) && variantId) {
        await mergeAndUpdateVariant(adminUrl, adminToken, productVariantService, ctx, String(variantId), variantAssetIds, variantFeaturedId ? String(variantFeaturedId) : undefined);
        Logger.info(`Variant assets/featured processed for variant ${variantId}`);
      }

    } catch (e: any) {
      Logger.error(`Failed to process row with SKU ${row.variantSku}. Error: ${e?.message}`, undefined, e?.stack);
    }
  }

  Logger.info('Import script finished.');
  process.exit(0);
}

async function findEntityIdsByCodes(
  ctx: RequestContext,
  service: any,
  key: 'code' | 'slug',
  codes: string[],
): Promise<string[]> {
  if (!codes || codes.length === 0) return [];
  const filtered = codes.filter(Boolean);
  if (filtered.length === 0) return [];
  const entities = await service.findAll(ctx, { filter: { [key]: { in: filtered } } });
  if (!entities || !entities.items || entities.items.length === 0) {
    Logger.warn(`No entities found for ${key} in [${filtered.join(', ')}]`);
    return [];
  }
  return entities.items.map((e: any) => e.id as string);
}

async function resolveFacetValueIds(
  ctx: RequestContext,
  facetService: any,
  facetValueService: any,
  tokenString?: string,
): Promise<string[]> {
  if (!tokenString) return [];
  const tokens = safeSplit(tokenString);
  const resultIds: string[] = [];

  for (const token of tokens) {
    let facetCode: string | undefined;
    let valueCode: string;

    if (token.includes(':')) {
      [facetCode, valueCode] = token.split(':').map(s => s.trim());
    } else {
      valueCode = token.trim();
    }

    let facetId: string | undefined;
    if (facetCode) {
      const facetsPaginated = await facetService.findAll(ctx);
      const facet = facetsPaginated?.items?.find((f: any) => f.code === facetCode);
      if (!facet) {
        Logger.warn(`Facet not found for code "${facetCode}" while resolving facet value "${valueCode}"`);
      } else {
        facetId = facet.id as string;
      }
    }

    const allFacetValues = await facetValueService.findAll(LanguageCode.en);
    let fv = allFacetValues?.find((f: any) => {
      if (facetId) {
        return f.code === valueCode && (f.facetId === facetId || f.facet?.id === facetId);
      }
      return f.code === valueCode;
    });

    if (fv) {
      resultIds.push(fv.id as string);
      continue;
    }

    if (facetId) {
      Logger.info(`Creating missing facet value "${valueCode}" under facet "${facetId}"`);
      const facetEntity = await facetService.findOne(ctx, facetId);
      if (!facetEntity) {
        Logger.warn(`Could not load facet entity with id ${facetId} to create facet value ${valueCode}`);
        continue;
      }
      const input = {
        code: valueCode,
        translations: [{ languageCode: LanguageCode.en, name: valueCode }],
      };
      const created = await facetValueService.create(ctx, facetEntity, input);
      resultIds.push((created as any).id as string);
      continue;
    }

    Logger.warn(`Facet value not found for code "${valueCode}" and no facet specified`);
  }

  return resultIds;
}

runImport().catch(err => {
  Logger.error('An unhandled error occurred:', undefined, err?.stack);
  process.exit(1);
});