const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Extract 'xiaowang'
const startOld = `{selectedAccount === 'xiaowang' &&`;
const idxOld = content.indexOf(startOld);
if (idxOld !== -1) {
    const endOldStr = `            )}
          </>
        )}`;
    const endOld = content.indexOf(endOldStr, idxOld);
    if (endOld !== -1) {
        fs.writeFileSync('xiaowang-raw.txt', content.slice(idxOld, endOld + endOldStr.length));
        console.log('Saved xiaowang-raw.txt');
    }
}

// 2. Extract 'xiaowang-test'
const startTest = `{selectedAccount === 'xiaowang-test' &&`;
const idxTest = content.indexOf(startTest);
if (idxTest !== -1) {
    // Just find a clear end. Let's look for the final `    </main>`
    const endTestStr = `      </div>
    </main>`;
    const endTest = content.indexOf(endTestStr, idxTest);
    if (endTest !== -1) {
        fs.writeFileSync('xiaowang-test-raw.txt', content.slice(idxTest, endTest));
        console.log('Saved xiaowang-test-raw.txt');
    } else {
        console.log('Could not find end of xiaowang-test');
    }
}
