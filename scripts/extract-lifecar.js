const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// Find start of LifeCar section
const startStr = `        {/* LifeCAR账号的数据面板 */}
        {selectedAccount === 'lifecar' && lifeCarData.length > 0 && (
          <>`;
const startIdx = content.indexOf(startStr);
if (startIdx === -1) {
    console.error("Could not find start of LifeCar section");
    process.exit(1);
}

// Find end of LifeCar section
const endStr = `            )}
          </>
        )}`;
const endIdx = content.indexOf(endStr, startIdx);
if (endIdx === -1) {
    console.error("Could not find end of LifeCar section");
    process.exit(1);
}

const lifecarContent = content.slice(startIdx + startStr.length, endIdx);

// It has a ton of props. I'll just save it to a temp file for me to read, or I'll generate the props interface dynamically.
fs.writeFileSync('lifecar-raw.txt', lifecarContent);
console.log('Saved raw lifecar content to lifecar-raw.txt, length', lifecarContent.length);
