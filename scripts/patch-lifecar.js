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

const before = content.slice(0, startIdx);
// The `after` string should just be the part AFTER `        )}`
const endSliceIdx = endIdx + endStr.length;
const after = content.slice(endSliceIdx);

const replacement = `        {/* LifeCAR账号的数据面板 */}
        {selectedAccount === 'lifecar' && (
          <LifecarDashboard 
            selectedAccount={selectedAccount}
            lifeCarData={lifeCarData}
            lifeCarLoading={lifeCarLoading}
            filteredLifeCarData={filteredLifeCarData}
            error={error}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            handleLastWeek={handleLastWeek}
            isLastWeekSelected={isLastWeekSelected}
            handleClearFilter={handleClearFilter}
            handlePreviousPeriod={handlePreviousPeriod}
            handleNextPeriod={handleNextPeriod}
            setShowNotesModal={setShowNotesModal}
            selectedNoteDates={selectedNoteDates}
            setSelectedNoteDates={setSelectedNoteDates}
            allModules={allModules}
            accountHiddenModules={accountHiddenModules}
            activeModule={activeModule}
            handleModuleChange={handleModuleChange}
            toggleModuleVisibility={toggleModuleVisibility}
            lifeCarMonthlyData={lifeCarMonthlyData}
            lifeCarNotesData={lifeCarNotesData}
            lifecarChartMetric={lifecarChartMetric}
            setLifecarChartMetric={setLifecarChartMetric}
            lifecarChartFiltered={lifecarChartFiltered}
            setLifecarChartFiltered={setLifecarChartFiltered}
            notesInDateRange={notesInDateRange}
            notesWeekdayCount={notesWeekdayCount}
            monthlyChartMetric={monthlyChartMetric}
            setMonthlyChartMetric={setMonthlyChartMetric}
            notesMonthlyCount={notesMonthlyCount}
          />
        )}`;

content = before + replacement + after;

// Add import
const importStatement = 'import { LifecarDashboard } from "@/components/lifecar-dashboard";\n';
const importTarget = 'import { DashboardHeader } from "@/components/dashboard-header";';
const importIdx = content.indexOf(importTarget);
if (importIdx !== -1) {
    const importEndIdx = content.indexOf('\n', importIdx) + 1;
    content = content.slice(0, importEndIdx) + importStatement + content.slice(importEndIdx);
} else {
    console.error("Could not find import target to anchor.");
    process.exit(1);
}

fs.writeFileSync(filePath, content);
console.log('Successfully replaced Lifecar block and added import properly!');
