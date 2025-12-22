// excelExport.js - Utility for exporting data to Excel
import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {string} sheetName - Name of the worksheet
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export table data to Excel with custom headers
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column definitions [{ header: 'Name', key: 'name' }]
 * @param {string} filename - Name of the file (without extension)
 * @param {string} sheetName - Name of the worksheet
 */
export const exportTableToExcel = (data, columns, filename = 'export', sheetName = 'Sheet1') => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Transform data based on column definitions
    const transformedData = data.map(row => {
        const transformedRow = {};
        columns.forEach(col => {
            transformedRow[col.header] = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '-';
        });
        return transformedRow;
    });

    exportToExcel(transformedData, filename, sheetName);
};
