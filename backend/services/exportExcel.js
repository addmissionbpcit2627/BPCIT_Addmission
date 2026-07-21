const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const DEPARTMENT_COLUMNS = [
  { header: 'Name', key: 'name', width: 22 },
  { header: 'Roll No', key: 'roll_no', width: 14 },
  { header: 'Registration No', key: 'registration_no', width: 18 },
  { header: 'Department', key: 'department', width: 14 },
  { header: 'Semester', key: 'semester', width: 10 },
  { header: 'Gender', key: 'gender', width: 10 },
  { header: 'Date of Birth', key: 'dob', width: 14 },
  { header: 'Phone', key: 'phone', width: 14 },
  { header: 'Email', key: 'email', width: 26 },
  { header: 'Address', key: 'address', width: 30 },
  { header: 'Guardian Name', key: 'guardian_name', width: 20 },
  { header: 'Guardian Phone', key: 'guardian_phone', width: 16 },
  { header: 'Blood Group', key: 'blood_group', width: 12 },
  { header: 'Admission Year', key: 'admission_year', width: 15 },
];

const HEADER_STYLE = {
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } },
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { argb: 'FF2980b9' } },
    left: { style: 'thin', color: { argb: 'FF2980b9' } },
    bottom: { style: 'thin', color: { argb: 'FF2980b9' } },
    right: { style: 'thin', color: { argb: 'FF2980b9' } },
  },
};

const ROW_STYLE_EVEN = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFecf0f1' } } };

function applyHeaderStyle(worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    Object.assign(cell, HEADER_STYLE);
  });
}

// ─── Department Excel ─────────────────────────────────────────────────────────
async function generateDepartmentExcel(students, department, res) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BPC Institute of Technology';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`${department} Students`, {
    views: [{ state: 'frozen', ySplit: 1 }],
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  sheet.columns = DEPARTMENT_COLUMNS;

  // Title row above headers
  sheet.spliceRows(1, 0, []);
  const titleRow = sheet.getRow(1);
  titleRow.getCell(1).value = `Department: ${department} – Student Report | Total: ${students.length}`;
  sheet.mergeCells(1, 1, 1, DEPARTMENT_COLUMNS.length);
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1e3a5f' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFbdd7ee' } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 30;

  // Header row
  const headerRow = sheet.getRow(2);
  DEPARTMENT_COLUMNS.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    Object.assign(cell, HEADER_STYLE);
  });
  headerRow.height = 24;
  sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: DEPARTMENT_COLUMNS.length } };

  // Data rows
  students.forEach((student, idx) => {
    const rowData = DEPARTMENT_COLUMNS.map((col) => {
      if (col.key === 'dob' && student.dob)
        return new Date(student.dob).toLocaleDateString('en-IN');
      return student[col.key] ?? '';
    });
    const row = sheet.addRow(rowData);
    row.height = 18;
    if (idx % 2 === 0) {
      row.eachCell((cell) => Object.assign(cell, ROW_STYLE_EVEN));
    }
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'hair' }, left: { style: 'hair' },
        bottom: { style: 'hair' }, right: { style: 'hair' },
      };
      cell.alignment = { wrapText: false, vertical: 'middle' };
    });
  });

  const filename = `department_${department}_students.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

// ─── Individual Student Excel ─────────────────────────────────────────────────
async function generateStudentExcel(student, res) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BPC Institute of Technology';

  const sheet = workbook.addWorksheet('Student Profile');

  // Title
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Student Profile Report';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF1e3a5f' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFbdd7ee' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 34;

  const fields = [
    ['Student Name', student.name],
    ['Roll Number', student.roll_no],
    ['Registration No', student.registration_no],
    ['Department', student.department],
    ['Semester', student.semester],
    ['Gender', student.gender],
    ['Date of Birth', student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : ''],
    ['Blood Group', student.blood_group],
    ['Admission Year', student.admission_year],
    ['Phone Number', student.phone],
    ['Email Address', student.email],
    ['Residential Address', student.address],
    ['Guardian Name', student.guardian_name],
    ['Guardian Phone', student.guardian_phone],
  ];

  fields.forEach(([label, value], i) => {
    const row = sheet.getRow(i + 2);
    row.height = 22;

    const labelCell = row.getCell(1);
    labelCell.value = label;
    labelCell.font = { bold: true, color: { argb: 'FF1e3a5f' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFecf0f1' } };
    labelCell.border = { top: { style: 'hair' }, left: { style: 'thin' }, bottom: { style: 'hair' }, right: { style: 'hair' } };
    labelCell.alignment = { vertical: 'middle', horizontal: 'left' };

    const valueCell = row.getCell(2);
    valueCell.value = value ?? '';
    valueCell.border = { top: { style: 'hair' }, left: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'thin' } };
    valueCell.alignment = { vertical: 'middle' };
  });

  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 38;

  const filename = `student_${student.roll_no}_profile.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { generateDepartmentExcel, generateStudentExcel };
