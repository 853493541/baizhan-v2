const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const dir = 'public/icons';

  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.png')) continue;
    if (f === 'app_icon.png') continue;
    if (f === 'app_icon_no_background.png') continue;

    const p = path.join(dir, f);

    await sharp(p)
      .resize(64, 64, { fit: 'inside' })
      .png({ compressionLevel: 9 })
      .toFile(p + '.tmp');

    fs.renameSync(p + '.tmp', p);
  }
}

run().then(() => {
  console.log('done');
}).catch(console.error);
