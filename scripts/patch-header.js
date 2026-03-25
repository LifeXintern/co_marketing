const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The replacement chunk
const replacement = `        <DashboardHeader
          selectedAccount={selectedAccount}
          handleAccountChange={handleAccountChange}
          setShowXiaowangTestUpload={setShowXiaowangTestUpload}
          setUploadAccountType={setUploadAccountType}
          setShowUpload={setShowUpload}
          setShowAllInOneUpload={setShowAllInOneUpload}
          handleFullscreen={handleFullscreen}
        />`;

// Replace lines 1488 to 1612
const lines = content.split('\n');
lines.splice(1487, 125, replacement);

// Add import
const importStatement = 'import { DashboardHeader } from "@/components/dashboard-header";';
let importAdded = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('import { XiaowangTestOverviewStats } from "@/components/xiaowang-test-overview-stats"')) {
    lines.splice(i + 1, 0, importStatement);
    importAdded = true;
    break;
  }
}

if (!importAdded) {
    console.error("Could not find the import statement to insert after.");
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Successfully replaced header and added import!');
