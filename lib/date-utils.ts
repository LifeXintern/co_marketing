import brokerDataJson from "@/public/broker_data.json";

// Convert Excel date serial number to JavaScript Date
export function excelDateToJSDate(excelDate: number): Date {
  // Excel's epoch is December 30, 1899
  const excelBase = new Date(1899, 11, 30);
  return new Date(excelBase.getTime() + excelDate * 24 * 60 * 60 * 1000);
}

/**
 * Format date with weekday: "Nov 27 (Wed)"
 * @param dateInput - YYYY-MM-DD string or Excel serial number
 * @returns Formatted date string with weekday
 */
export function formatDateWithWeekday(dateInput: string | number): string {
  let date: Date;

  if (typeof dateInput === 'number') {
    // Excel serial number
    date = excelDateToJSDate(dateInput);
  } else {
    // String date (YYYY-MM-DD)
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) {
    return String(dateInput); // Return original if invalid
  }

  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });

  return `${month} ${day} (${weekday})`;
}

// Get the actual data range from broker data
export function getDataRange(): { start: string; end: string } {
  try {
    const dates = brokerDataJson
      .map(item => {
        if (typeof item.date === 'number') {
          return excelDateToJSDate(item.date);
        }
        return new Date(item.date);
      })
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) {
      return { start: 'No data', end: 'No data' };
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
    };

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    return {
      start: formatDate(startDate),
      end: formatDate(endDate)
    };
  } catch (error) {
    console.error('Error calculating data range:', error);
    return { start: 'Unknown', end: 'Unknown' };
  }
}