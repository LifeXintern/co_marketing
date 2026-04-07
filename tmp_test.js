const XLSX = require('xlsx');

function formatExcelDateStr(excelDate) {
  if (typeof excelDate === 'number') {
    const dt = new Date(Date.UTC(1899, 11, 30) + excelDate * 24 * 60 * 60 * 1000);
    return dt.toISOString().split('T')[0];
  } else if (typeof excelDate === 'string') {
    if (excelDate.includes('/')) {
      const parts = excelDate.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parseInt(parts[2]);
        if (year < 100) year = year > 50 ? 1900 + year : 2000 + year;
        return `${year}-${month}-${day}`;
      }
    }
  }
  return null;
}

const workbook = XLSX.readFile('c:/Users/inter/co-marketing/co_marketing/AssistingFiles/Copy of Marketing_Database_mes_type.xlsx');
const sheetName = workbook.SheetNames.find(name =>
      name === 'Clients_info（new）' ||
      name.toLowerCase() === 'client_info'
);
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

const brokerData = data.map((row) => {
  let dateStr = row['日期'] || row.date || '';

  if (!dateStr) {
    const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('date') || k.includes('日期') || k.trim() === '日期');
    if (dateKey) dateStr = row[dateKey];
  }

  const formatted = formatExcelDateStr(dateStr);
  if (formatted) dateStr = formatted;

  return {
    no: row['No.'] || row.no,
    broker: row['Broker'] || row.broker,
    date: dateStr,
    wechat: row['微信'] || row.wechat,
  }
});

const startRange = "2026-03-23";
const endRange = "2026-03-29";

const filtered = brokerData.filter(d => d.date >= startRange && d.date <= endRange);

console.log(`Total Leads found matching ${startRange} to ${endRange}: ${filtered.length}`);
const dayCounts = {};
filtered.forEach(d => {
  dayCounts[d.date] = (dayCounts[d.date] || 0) + 1;
});
console.log("Day counts:", dayCounts);

const displayMapped = [];
filtered.forEach(f => displayMapped.push(`${f.no}: ${f.date}`));
console.log("Details:", displayMapped.join(', '));
