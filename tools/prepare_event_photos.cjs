const sharp = require('C:/Users/Aden Then/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const generated='C:/Users/Aden Then/.codex/generated_images/01a14762-212b-7b20-9111-13791755b7b3';
const files=[
 ['black-pepper','exec-ae364c1c-f174-4a86-abec-24e2ff2da846.png'],
 ['chicken-nugget','exec-35bc2f0c-c30c-42c2-9612-bd49819dae52.png'],
 ['chicken-wing','exec-94fb32e1-a7e2-46c8-b518-47bc388150c2.png'],
 ['luncheon-meat','exec-39b0f6a8-467a-4573-bc6f-b466f77b633d.png'],
 ['edamame','exec-c5eb454a-660f-41b9-a39c-1e747a0c3c93.png'],
];
(async()=>{
 const thumbs=[];
 for (const [i,[name,file]] of files.entries()) {
  const out=`public/images/event-${name}.webp`;
  await sharp(path.join(generated,file)).resize(800,800,{fit:'inside',withoutEnlargement:true}).webp({quality:86}).toFile(out);
  thumbs.push({input:await sharp(out).resize(320,320).toBuffer(),left:(i%3)*320,top:Math.floor(i/3)*320});
  console.log(out,(await fs.stat(out)).size);
 }
 await sharp('public/images/event-aglio-olio.png').resize(800,800,{fit:'inside'}).webp({quality:86}).toFile('public/images/event-aglio-olio.webp');
 await fs.mkdir('output/web-photos',{recursive:true});
 await sharp({create:{width:960,height:640,channels:3,background:'#171717'}}).composite(thumbs).png().toFile('output/web-photos/new-food-contact-sheet.png');
})();
