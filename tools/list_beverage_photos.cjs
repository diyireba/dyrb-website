const fs=require('node:fs/promises');
(async()=>{
 let source=await fs.readFile('src/data.js','utf8');
 source=source.replace("import { createClient } from '@supabase/supabase-js'",'').replaceAll('import.meta.env','({})');
 global.localStorage={getItem:()=>null};
 const data=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const menu=(await data.getOperations('owner')).menu;
 const exclude=new Set(['DYRB Special (Haaland)','DYRB Special Virgin Haaland','See You Tomorrow','Grave Yard']);
 const jobs=[...new Map(menu.filter(x=>!['mains','bites'].includes(x.category)).map(x=>{const name=x.name.split(' · ')[0];return [x.category+'|'+name,{category:x.category,name,file:`drink-${x.category}-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'')}.webp`}]})).values()].filter(x=>!exclude.has(x.name));
 await fs.writeFile('output/web-photos/beverage-assets.json',JSON.stringify(jobs,null,2));
 console.log(jobs.length+' beverage photos mapped');
})();
