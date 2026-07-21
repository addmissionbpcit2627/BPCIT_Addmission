const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = require('../config/uploadDir');

const COLORS = {
  primary: '#1e3a5f',
  secondary: '#2980b9',
  accent: '#f39c12',
  light: '#ecf0f1',
  text: '#2c3e50',
  white: '#ffffff',
};

/**
 * Draw a styled header
 */
function drawHeader(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 100).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(22).font('Helvetica-Bold')
    .text(title, 40, 28, { align: 'left' });
  if (subtitle) {
    doc.fontSize(12).font('Helvetica')
      .text(subtitle, 40, 58, { align: 'left' });
  }
  doc.fillColor(COLORS.accent).rect(0, 100, doc.page.width, 4).fill();
  doc.fillColor(COLORS.text);
  return 120;
}

/**
 * Draw a labeled value row
 */
function drawField(doc, label, value, x, y, colWidth = 240) {
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.secondary)
    .text(label.toUpperCase(), x, y);
  doc.fontSize(11).font('Helvetica').fillColor(COLORS.text)
    .text(value || '—', x, y + 14, { width: colWidth - 10 });
  return y + 42;
}

/**
 * Format a date nicely
 */
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Individual Student PDF ───────────────────────────────────────────────────
async function generateStudentPDF(student, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  const filename = `student_${student.roll_no}_profile.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  let y = drawHeader(doc, 'Student Profile Report', 'BPC Institute of Technology');

  // Photo section
  const photoPath = student.photo
    ? path.join(UPLOAD_DIR, student.photo)
    : null;

  const hasPhoto = photoPath && fs.existsSync(photoPath);
  if (hasPhoto) {
    try {
      doc.image(photoPath, doc.page.width - 140, y, { width: 100, height: 115, fit: [100, 115] });
    } catch (_) {}
  }

  // Student name banner
  doc.rect(40, y, doc.page.width - hasPhoto ? 200 : 520, 50).fill(COLORS.light);
  doc.fillColor(COLORS.primary).fontSize(18).font('Helvetica-Bold')
    .text(student.name, 55, y + 14);
  y += 60;

  // Section helper
  const sectionTitle = (title, yPos) => {
    doc.rect(40, yPos, doc.page.width - 80, 22).fill(COLORS.secondary);
    doc.fillColor(COLORS.white).fontSize(11).font('Helvetica-Bold')
      .text(title, 50, yPos + 5);
    doc.fillColor(COLORS.text);
    return yPos + 32;
  };

  // Academic Details
  y = sectionTitle('Academic Details', y);
  const col1 = 40, col2 = 310;
  let leftY = y, rightY = y;
  leftY = drawField(doc, 'Roll Number', student.roll_no, col1, leftY);
  rightY = drawField(doc, 'Registration No', student.registration_no, col2, rightY);
  leftY = drawField(doc, 'Department', student.department, col1, leftY);
  rightY = drawField(doc, 'Semester', String(student.semester), col2, rightY);
  leftY = drawField(doc, 'Admission Year', String(student.admission_year || ''), col1, leftY);
  y = Math.max(leftY, rightY) + 10;

  // Personal Details
  y = sectionTitle('Personal Details', y);
  leftY = y; rightY = y;
  leftY = drawField(doc, 'Gender', student.gender, col1, leftY);
  rightY = drawField(doc, 'Date of Birth', formatDate(student.dob), col2, rightY);
  leftY = drawField(doc, 'Blood Group', student.blood_group, col1, leftY);
  y = Math.max(leftY, rightY) + 10;

  // Contact Details
  y = sectionTitle('Contact Details', y);
  leftY = y; rightY = y;
  leftY = drawField(doc, 'Phone Number', student.phone, col1, leftY);
  rightY = drawField(doc, 'Email Address', student.email, col2, rightY);
  leftY = drawField(doc, 'Residential Address', student.address, col1, leftY, 260);
  y = Math.max(leftY, rightY) + 10;

  // Guardian Details
  y = sectionTitle('Guardian Details', y);
  leftY = y; rightY = y;
  drawField(doc, 'Guardian Name', student.guardian_name, col1, leftY);
  drawField(doc, 'Guardian Phone', student.guardian_phone, col2, rightY);
  y = leftY + 50;

  // Footer
  doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(9).font('Helvetica')
    .text(
      `Generated on ${new Date().toLocaleString('en-IN')}  |  BPC Institute of Technology`,
      40,
      doc.page.height - 28,
      { align: 'center' }
    );

  doc.end();
}

// ─── Department PDF ───────────────────────────────────────────────────────────
async function generateDepartmentPDF(students, department, res) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });

  const filename = `department_${department}_students.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  let y = drawHeader(
    doc,
    `Department: ${department} – Student Report`,
    `Total Students: ${students.length}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`
  );

  if (!students.length) {
    doc.fontSize(14).fillColor(COLORS.text).text('No students found in this department.', 40, y + 20);
    doc.end();
    return;
  }

  // Table header
  const cols = [
    { label: 'Name', width: 130, key: 'name' },
    { label: 'Roll No', width: 80, key: 'roll_no' },
    { label: 'Reg. No', width: 90, key: 'registration_no' },
    { label: 'Sem', width: 35, key: 'semester' },
    { label: 'Gender', width: 55, key: 'gender' },
    { label: 'Phone', width: 90, key: 'phone' },
    { label: 'Email', width: 160, key: 'email' },
    { label: 'Blood', width: 45, key: 'blood_group' },
    { label: 'Adm Yr', width: 55, key: 'admission_year' },
  ];

  const tableLeft = 40;
  const rowHeight = 22;
  const headerHeight = 26;

  // Draw header row
  doc.rect(tableLeft, y, cols.reduce((s, c) => s + c.width, 0), headerHeight).fill(COLORS.secondary);
  let cx = tableLeft;
  doc.fillColor(COLORS.white).fontSize(9).font('Helvetica-Bold');
  cols.forEach((col) => {
    doc.text(col.label, cx + 4, y + 8, { width: col.width - 6 });
    cx += col.width;
  });
  y += headerHeight;

  // Draw rows
  students.forEach((student, idx) => {
    if (y + rowHeight > doc.page.height - 60) {
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 });
      y = 40;
      // Repeat header on new page
      doc.rect(tableLeft, y, cols.reduce((s, c) => s + c.width, 0), headerHeight).fill(COLORS.secondary);
      cx = tableLeft;
      doc.fillColor(COLORS.white).fontSize(9).font('Helvetica-Bold');
      cols.forEach((col) => {
        doc.text(col.label, cx + 4, y + 8, { width: col.width - 6 });
        cx += col.width;
      });
      y += headerHeight;
    }

    // Alternating row bg
    if (idx % 2 === 0) {
      doc.rect(tableLeft, y, cols.reduce((s, c) => s + c.width, 0), rowHeight).fill(COLORS.light);
    }

    cx = tableLeft;
    doc.fillColor(COLORS.text).fontSize(8).font('Helvetica');
    cols.forEach((col) => {
      const val = String(student[col.key] || '—');
      doc.text(val, cx + 4, y + 6, { width: col.width - 6 });
      cx += col.width;
    });

    // Row border
    doc.rect(tableLeft, y, cols.reduce((s, c) => s + c.width, 0), rowHeight)
      .stroke('#c0c0c0');
    y += rowHeight;
  });

  // Footer
  doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(9).font('Helvetica')
    .text(
      `Generated on ${new Date().toLocaleString('en-IN')}  |  BPC Institute of Technology`,
      40,
      doc.page.height - 28,
      { align: 'center' }
    );

  doc.end();
}

module.exports = { generateStudentPDF, generateDepartmentPDF };
