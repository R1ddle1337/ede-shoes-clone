#!/usr/bin/env node
/** Import source content pages as BigCommerce web pages. Run with owner authorization. */
import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const hash=process.env.BC_STORE_HASH, token=process.env.BC_ACCESS_TOKEN;
if(!hash||!token) throw new Error('Set BC_STORE_HASH and BC_ACCESS_TOKEN');
const pages=JSON.parse(await fs.readFile(new URL('../data/ede-pages.json',import.meta.url))).pages;
const headers={'X-Auth-Token':token,'Content-Type':'application/json','Accept':'application/json'};
const api=`https://api.bigcommerce.com/stores/${hash}/v3/content/pages`;
for(const page of pages){
  const html=await (await fetch(page.url)).text();
  const doc=new JSDOM(html).window.document;
  const node=doc.querySelector('.page-content, main#main-content, #main-content');
  if(!node) continue;
  const path=new URL(page.url).pathname.replace(/^\//,'').replace(/\/$/,'');
  const body={name:page.title||path, is_visible:true, url:{path:`/${path}/`,is_customized:true}, body:node.innerHTML, meta_title:page.title||'', meta_description:doc.querySelector('meta[name="description"]')?.content||''};
  const r=await fetch(api,{method:'POST',headers,body:JSON.stringify(body)});
  if(!r.ok) console.warn('page failed',path,r.status,await r.text()); else console.log('imported page',path);
}
