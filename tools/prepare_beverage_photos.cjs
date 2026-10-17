const fs=require('node:fs/promises');
const sharp=require('C:/Users/Aden Then/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const jobs=JSON.parse(await fs.readFile('output/web-photos/beverage-assets.json','utf8'));
 const results=JSON.parse(await fs.readFile('output/web-photos/beverage-generation-results.json','utf8'));
 const ordered=[];
 for(const job of jobs){
  const result=results.find(r=>r.file===job.file);
  if(!result||result.error) throw new Error(job.name+': '+(result?.error||'missing result'));
  const match=result.hint.match(/as (C:.*?\.png) by default/);
  if(!match) throw new Error('Missing source path: '+job.name);
  const output='public/images/'+job.file;
  await sharp(match[1]).resize(700,700,{fit:'inside',withoutEnlargement:true}).webp({quality:84}).toFile(output);
  ordered.push({...job,bytes:(await fs.stat(output)).size});
 }
 const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
 for(let sheet=0;sheet<2;sheet++){
  const composite=[];
  const section=ordered.slice(sheet*20,sheet*20+20);
  for(const [i,job] of section.entries()){
   const x=(i%5)*240,y=Math.floor(i/5)*266;
   composite.push({input:await sharp('public/images/'+job.file).resize(232,232).toBuffer(),left:x+4,top:y});
   let title=job.name.length>31?job.name.slice(0,30)+'…':job.name;
   const svg=`<svg width="240" height="34"><rect width="240" height="34" fill="#171717"/><text x="5" y="15" fill="white" font-size="11" font-family="Arial">${escape(title)}</text><text x="5" y="29" fill="#aaaaaa" font-size="10" font-family="Arial">${job.category}</text></svg>`;
   composite.push({input:Buffer.from(svg),left:x,top:y+232});
  }
  await sharp({create:{width:1200,height:1064,channels:3,background:'#171717'}}).composite(composite).png().toFile(`output/web-photos/beverage-contact-sheet-${sheet+1}.png`);
 }
 await fs.writeFile('output/web-photos/beverage-photo-manifest.json',JSON.stringify(ordered,null,2));
 console.log('Prepared '+ordered.length+' drink photos; total '+Math.round(ordered.reduce((s,x)=>s+x.bytes,0)/1024)+' KB');
})();
