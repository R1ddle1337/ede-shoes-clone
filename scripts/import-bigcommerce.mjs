#!/usr/bin/env node
/** Import the captured source catalog into a BigCommerce store. Requires owner credentials. */
import fs from 'node:fs/promises';

const hash = process.env.BC_STORE_HASH;
const token = process.env.BC_ACCESS_TOKEN;
const womenCategory = Number(process.env.BC_WOMEN_CATEGORY_ID || 0);
const menCategory = Number(process.env.BC_MEN_CATEGORY_ID || 0);
if (!hash || !token) throw new Error('Set BC_STORE_HASH and BC_ACCESS_TOKEN');
const catalog = JSON.parse(await fs.readFile(new URL('../data/ede-catalog.json', import.meta.url)));
const api = `https://api.bigcommerce.com/stores/${hash}/v3`;
const headers = {'X-Auth-Token': token, 'Content-Type':'application/json', 'Accept':'application/json'};
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
for (const item of catalog.products) {
  const sku = `EDE-${slugify(item.slug).slice(0,48)}`;
  const body = {name:item.name, sku, type:'physical', description:item.description || '', price:Number(item.price || 0), weight:0, is_visible:true, availability:'available', custom_url:{url:`/${item.slug}/`,is_customized:true}};
  const category = /women|womens|loafer/i.test(item.slug) ? womenCategory : menCategory;
  if (category) body.categories=[category];
  let r = await fetch(`${api}/catalog/products`, {method:'POST',headers,body:JSON.stringify(body)});
  if (r.status === 409) { console.log('exists',sku); continue; }
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const product=(await r.json()).data;
  for (const sourceOption of item.options || []) {
    const optionBody={name: sourceOption.name, display_name:'Size', type:'radio_buttons', sort_order:0, option_values:(sourceOption.values||[]).map((v,i)=>({label:v.label||v.value,sort_order:i,is_default:i===0}))};
    const or=await fetch(`${api}/catalog/products/${product.id}/options`,{method:'POST',headers,body:JSON.stringify(optionBody)});
    if(!or.ok) console.warn('option failed',sku,or.status,await or.text());
  }
  for (const image of item.images || []) {
    const ir=await fetch(`${api}/catalog/products/${product.id}/images`,{method:'POST',headers,body:JSON.stringify({image_url:image,sort_order:0,is_thumbnail:false})});
    if (!ir.ok) console.warn('image failed',sku,image,ir.status);
  }
  console.log('imported',sku);
}
