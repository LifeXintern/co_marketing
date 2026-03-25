const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `        <div className="w-full px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 md:gap-4 py-2.5 md:py-3">`;

const startIdx = content.indexOf(targetStr);
if (startIdx === -1) {
    console.error("Could not find start target!");
    process.exit(1);
}

const endTargetStr = `          </div>
        </div>

      </nav>`;

const endIdx = content.indexOf(endTargetStr, startIdx);
if (endIdx === -1) {
    console.error("Could not find end target!");
    process.exit(1);
}

const before = content.slice(0, startIdx);
const navIdx = content.indexOf('      </nav>', endIdx);
const after = content.slice(navIdx);

const replacement = `        <DashboardHeader
          selectedAccount={selectedAccount}
          handleAccountChange={handleAccountChange}
          setShowXiaowangTestUpload={setShowXiaowangTestUpload}
          setUploadAccountType={setUploadAccountType}
          setShowUpload={setShowUpload}
          setShowAllInOneUpload={setShowAllInOneUpload}
          handleFullscreen={handleFullscreen}
        />\n\n`;

content = before + replacement + after;

// Add import
const importStatement = 'import { DashboardHeader } from "@/components/dashboard-header";\n';
const importTarget = 'import { XiaowangTestOverviewStats } from "@/components/xiaowang-test-overview-stats"';
const importIdx = content.indexOf(importTarget);
if (importIdx !== -1) {
    const importEndIdx = content.indexOf('\n', importIdx) + 1;
    content = content.slice(0, importEndIdx) + importStatement + content.slice(importEndIdx);
} else {
    console.error("Could not find import target to anchor.");
    process.exit(1);
}

fs.writeFileSync(filePath, content);
console.log('Successfully replaced header and added import properly!');
