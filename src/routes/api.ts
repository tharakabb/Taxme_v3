import express from 'express';
import multer from 'multer';
import PDFDocument from 'pdfkit';
import { PDFDocument as PDFLibDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { calculatePersonalTax, calculateCorporateTax, calculateInstallments, TAX_CALENDAR } from '../utils/tax';

const router = express.Router();

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({ dest: 'uploads/' });

// --- Categories ---

router.get('/categories', authenticateToken, (req: AuthRequest, res) => {
  const stmt = db.prepare('SELECT * FROM user_categories WHERE user_id = ? ORDER BY name ASC');
  const categories = stmt.all(req.user!.id);
  res.json(categories);
});

router.post('/categories', authenticateToken, (req: AuthRequest, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });
  
  const id = uuidv4();
  try {
    const stmt = db.prepare('INSERT INTO user_categories (id, user_id, name, type) VALUES (?, ?, ?, ?)');
    stmt.run(id, req.user!.id, name.trim(), type);
    res.json({ id, name: name.trim(), type });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Failed to add category' });
  }
});

router.put('/categories/:id', authenticateToken, (req: AuthRequest, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

  try {
    const stmt = db.prepare('UPDATE user_categories SET name = ?, type = ? WHERE id = ? AND user_id = ?');
    const result = stmt.run(name.trim(), type, req.params.id, req.user!.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category updated' });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', authenticateToken, (req: AuthRequest, res) => {
  const stmt = db.prepare('DELETE FROM user_categories WHERE id = ? AND user_id = ?');
  const result = stmt.run(req.params.id, req.user!.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
  res.json({ message: 'Category deleted' });
});

function saveCategory(userId: string, name: string, type: string) {
  if (!name || !name.trim()) return;
  try {
    const stmt = db.prepare('INSERT OR IGNORE INTO user_categories (id, user_id, name, type) VALUES (?, ?, ?, ?)');
    stmt.run(uuidv4(), userId, name.trim(), type);
  } catch (err) {
    console.error('Error saving category:', err);
  }
}

// --- Transactions ---

router.get('/transactions', authenticateToken, (req: AuthRequest, res) => {
  const stmt = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC');
  const transactions = stmt.all(req.user!.id);
  res.json(transactions);
});

router.post('/transactions', authenticateToken, upload.single('receipt'), (req: AuthRequest, res) => {
  const { date, vendor, amount, type, category, description } = req.body;
  const id = uuidv4();
  const receipt_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  const stmt = db.prepare('INSERT INTO transactions (id, user_id, date, vendor, amount, type, category, description, receipt_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, req.user!.id, date, vendor, amount, type, category, description, receipt_url);
  
  saveCategory(req.user!.id, category, type);
  
  res.json({ id, message: 'Transaction added', receipt_url });
});

router.put('/transactions/:id', authenticateToken, upload.single('receipt'), (req: AuthRequest, res) => {
  const { date, vendor, amount, type, category, description } = req.body;
  const receipt_url = req.file ? `/uploads/${req.file.filename}` : undefined;
  
  let query = 'UPDATE transactions SET date = ?, vendor = ?, amount = ?, type = ?, category = ?, description = ?';
  const params: any[] = [date, vendor, amount, type, category, description];
  
  if (receipt_url) {
    query += ', receipt_url = ?';
    params.push(receipt_url);
  }
  
  query += ' WHERE id = ? AND user_id = ?';
  params.push(req.params.id, req.user!.id);
  
  const stmt = db.prepare(query);
  const result = stmt.run(...params);
  
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  
  saveCategory(req.user!.id, category, type);
  
  res.json({ message: 'Transaction updated', receipt_url });
});

router.delete('/transactions/:id', authenticateToken, (req: AuthRequest, res) => {
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?');
  const result = stmt.run(req.params.id, req.user!.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

// --- Assets ---

router.get('/assets', authenticateToken, (req: AuthRequest, res) => {
  const stmt = db.prepare('SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC');
  const assets = stmt.all(req.user!.id);
  res.json(assets);
});

router.post('/assets', authenticateToken, (req: AuthRequest, res) => {
  const { name, type, value, acquisition_date, income_generated } = req.body;
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO assets (id, user_id, name, type, value, acquisition_date, income_generated) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, req.user!.id, name, type, value, acquisition_date, income_generated || 0);
  res.json({ id, message: 'Asset added' });
});

router.delete('/assets/:id', authenticateToken, (req: AuthRequest, res) => {
  const stmt = db.prepare('DELETE FROM assets WHERE id = ? AND user_id = ?');
  const result = stmt.run(req.params.id, req.user!.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

// --- Salary Config ---

router.get('/salary', authenticateToken, (req: AuthRequest, res) => {
  const stmt = db.prepare('SELECT * FROM salary_configs WHERE user_id = ?');
  const config = stmt.get(req.user!.id);
  res.json(config || { basic_salary: 0, allowances: 0, deductions: 0 });
});

router.post('/salary', authenticateToken, (req: AuthRequest, res) => {
  const { basic_salary, allowances, deductions } = req.body;
  
  // Upsert
  const stmt = db.prepare(`
    INSERT INTO salary_configs (user_id, basic_salary, allowances, deductions, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      basic_salary = excluded.basic_salary,
      allowances = excluded.allowances,
      deductions = excluded.deductions,
      updated_at = excluded.updated_at
  `);
  
  stmt.run(req.user!.id, basic_salary || 0, allowances || 0, deductions || 0);
  res.json({ message: 'Salary configuration updated' });
});

// --- Tax Calculation & Reports ---

router.get('/tax-summary', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const userType = req.user!.user_type; // 'personal', 'sole_prop', 'pvt_ltd'

  // Fetch data
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ?').all(userId) as any[];
  const assets = db.prepare('SELECT * FROM assets WHERE user_id = ?').all(userId) as any[];
  const salaryConfig = db.prepare('SELECT * FROM salary_configs WHERE user_id = ?').get(userId) as any;

  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalAssetIncome = 0;
  let rentIncome = 0;
  let annualSalary = 0;

  if (salaryConfig) {
    annualSalary = (salaryConfig.basic_salary + salaryConfig.allowances) * 12;
  }

  transactions.forEach(t => {
    if (t.type === 'revenue') totalRevenue += t.amount;
    if (t.type === 'expense') totalExpenses += t.amount;
  });

  assets.forEach(a => {
    if (a.type === 'rent') {
      rentIncome += (a.income_generated || 0);
    } else {
      totalAssetIncome += (a.income_generated || 0);
    }
  });

  const rentRelief = rentIncome * 0.25;
  const taxableRentIncome = rentIncome - rentRelief;
  totalAssetIncome += taxableRentIncome;

  const netProfit = totalRevenue - totalExpenses + totalAssetIncome + annualSalary;
  let taxData;

  if (userType === 'pvt_ltd') {
    // Simplified: Assuming standard rate for now, user can toggle in UI but backend defaults to standard
    const tax = calculateCorporateTax(netProfit, 'standard');
    taxData = {
      netProfit,
      taxLiability: tax,
      effectiveRate: 30
    };
  } else {
    // Personal or Sole Prop
    taxData = calculatePersonalTax(netProfit);
  }

  res.json({
    revenue: totalRevenue,
    expenses: totalExpenses,
    assetIncome: totalAssetIncome,
    salaryIncome: annualSalary,
    netProfit,
    tax: taxData,
    installments: calculateInstallments(taxData.taxLiability),
    calendar: TAX_CALENDAR
  });
});

router.get('/financial-statements', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const period = req.query.period as string || 'all';
  
  let dateFilter = '';
  const currentYear = new Date().getFullYear();
  if (period === 'this_year') {
    dateFilter = `AND date >= '${currentYear}-01-01' AND date <= '${currentYear}-12-31'`;
  } else if (period === 'last_year') {
    dateFilter = `AND date >= '${currentYear - 1}-01-01' AND date <= '${currentYear - 1}-12-31'`;
  }

  const transactions = db.prepare(`SELECT * FROM transactions WHERE user_id = ? ${dateFilter} ORDER BY date DESC`).all(userId) as any[];
  const assets = db.prepare('SELECT * FROM assets WHERE user_id = ?').all(userId) as any[];
  const salaryConfig = db.prepare('SELECT * FROM salary_configs WHERE user_id = ?').get(userId) as any;

  // P&L
  const revenue = transactions.filter(t => t.type === 'revenue');
  const expenses = transactions.filter(t => t.type === 'expense');
  
  const totalRevenue = revenue.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  let annualSalary = 0;
  if (salaryConfig) {
    annualSalary = (salaryConfig.basic_salary + salaryConfig.allowances) * 12;
  }

  const netProfit = totalRevenue - totalExpenses + annualSalary;

  // Balance Sheet (Simplified)
  // Assets = Total Assets Value
  // Liabilities = 0 (Not tracking liabilities yet)
  // Equity = Assets - Liabilities
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);

  res.json({
    pl: {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      annualSalary,
      netProfit
    },
    balanceSheet: {
      assets,
      totalAssets,
      totalLiabilities: 0,
      equity: totalAssets
    }
  });
});

router.get('/report/pdf', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const userType = req.user!.user_type;
  const reportType = req.query.type as string || 'full';
  const period = req.query.period as string || 'all';
  const filename = req.query.filename ? `${req.query.filename}.pdf` : 'tax_report.pdf';

  let dateFilter = '';
  const currentYear = new Date().getFullYear();
  if (period === 'this_year') {
    dateFilter = `AND date >= '${currentYear}-01-01' AND date <= '${currentYear}-12-31'`;
  } else if (period === 'last_year') {
    dateFilter = `AND date >= '${currentYear - 1}-01-01' AND date <= '${currentYear - 1}-12-31'`;
  }

  if (reportType === 'revenue_slips' || reportType === 'expense_slips') {
    const txType = reportType === 'revenue_slips' ? 'revenue' : 'expense';
    const transactions = db.prepare(`SELECT * FROM transactions WHERE user_id = ? AND type = ? AND receipt_url IS NOT NULL ${dateFilter}`).all(userId, txType) as any[];
    
    try {
      const mergedPdf = await PDFLibDocument.create();
      const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await mergedPdf.embedFont(StandardFonts.Helvetica);
      
      // Add Cover Page
      const coverPage = mergedPdf.addPage([595.28, 841.89]); // A4
      const { width: cw, height: ch } = coverPage.getSize();
      
      // Background for cover
      coverPage.drawRectangle({
        x: 0,
        y: ch - 150,
        width: cw,
        height: 150,
        color: rgb(0.216, 0.188, 0.639), // #3730a3
      });

      coverPage.drawText('TaxMe', {
        x: 50,
        y: ch - 70,
        size: 32,
        font: boldFont,
        color: rgb(1, 1, 1),
      });

      coverPage.drawText(reportType === 'revenue_slips' ? 'Consolidated Revenue Receipts' : 'Consolidated Expense Receipts', {
        x: 50,
        y: ch - 110,
        size: 18,
        font: regularFont,
        color: rgb(1, 1, 1),
      });

      coverPage.drawText(`Report Period: ${period.replace('_', ' ').toUpperCase()}`, {
        x: 50,
        y: ch - 200,
        size: 12,
        font: boldFont,
      });

      coverPage.drawText(`Generated on: ${new Date().toLocaleString()}`, {
        x: 50,
        y: ch - 220,
        size: 10,
        font: regularFont,
      });

      coverPage.drawText(`Total Documents: ${transactions.length}`, {
        x: 50,
        y: ch - 240,
        size: 10,
        font: regularFont,
      });

      let count = 0;
      for (const t of transactions) {
        const relativePath = t.receipt_url.startsWith('/') ? t.receipt_url.substring(1) : t.receipt_url;
        const filePath = path.join(process.cwd(), relativePath);
        
        if (!fs.existsSync(filePath)) {
          console.warn(`File not found: ${filePath}`);
          continue;
        }

        try {
          const fileBytes = fs.readFileSync(filePath);
          const ext = path.extname(filePath).toLowerCase();

          if (ext === '.pdf') {
            const pdfDoc = await PDFLibDocument.load(fileBytes);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            
            copiedPages.forEach((page, idx) => {
              mergedPdf.addPage(page);
              // Add a small footer to merged pages
              page.drawText(`Receipt ${count + 1} - ${t.vendor || 'N/A'} (${t.date}) - Page ${idx + 1}`, {
                x: 30,
                y: 20,
                size: 8,
                font: regularFont,
                color: rgb(0.5, 0.5, 0.5),
              });
            });
          } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            let image;
            if (ext === '.png') {
              image = await mergedPdf.embedPng(fileBytes);
            } else {
              image = await mergedPdf.embedJpg(fileBytes);
            }
            
            const page = mergedPdf.addPage([595.28, 841.89]); // A4
            const { width, height } = page.getSize();
            
            // Scale image to fit page with margins
            const margin = 50;
            const imgDims = image.scaleToFit(width - (margin * 2), height - (margin * 2) - 40);
            
            page.drawImage(image, {
              x: width / 2 - imgDims.width / 2,
              y: height / 2 - imgDims.height / 2 + 20,
              width: imgDims.width,
              height: imgDims.height,
            });

            // Add label
            page.drawText(`Receipt ${count + 1}: ${t.vendor || 'N/A'}`, {
              x: margin,
              y: height - 40,
              size: 12,
              font: boldFont,
            });
            page.drawText(`Date: ${t.date} | Amount: LKR ${t.amount.toLocaleString()}`, {
              x: margin,
              y: height - 55,
              size: 10,
              font: regularFont,
            });
          }
          count++;
        } catch (fileErr) {
          console.error(`Error processing file ${filePath}:`, fileErr);
        }
      }

      const pdfBytes = await mergedPdf.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(pdfBytes));
      return;
    } catch (err) {
      console.error('Error merging receipts:', err);
      res.status(500).json({ error: 'Failed to merge receipts' });
      return;
    }
  }

  // Re-fetch summary logic
  const transactions = db.prepare(`SELECT * FROM transactions WHERE user_id = ? ${dateFilter}`).all(userId) as any[];
  const assets = db.prepare('SELECT * FROM assets WHERE user_id = ?').all(userId) as any[];
  const salaryConfig = db.prepare('SELECT * FROM salary_configs WHERE user_id = ?').get(userId) as any;
  const userStmt = db.prepare('SELECT tin, period_code FROM users WHERE id = ?');
  const userData = userStmt.get(userId) as any;

  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalAssetIncome = 0;
  let rentIncome = 0;
  let annualSalary = 0;

  if (salaryConfig) {
    annualSalary = (salaryConfig.basic_salary + salaryConfig.allowances) * 12;
  }

  transactions.forEach(t => {
    if (t.type === 'revenue') totalRevenue += t.amount;
    if (t.type === 'expense') totalExpenses += t.amount;
  });

  assets.forEach(a => {
    if (a.type === 'rent') {
      rentIncome += (a.income_generated || 0);
    } else {
      totalAssetIncome += (a.income_generated || 0);
    }
  });

  const rentRelief = rentIncome * 0.25;
  const taxableRentIncome = rentIncome - rentRelief;
  totalAssetIncome += taxableRentIncome;

  const netProfit = totalRevenue - totalExpenses + totalAssetIncome + annualSalary;
  let taxData: any;

  if (userType === 'pvt_ltd') {
    const tax = calculateCorporateTax(netProfit, 'standard');
    taxData = {
      taxableIncome: netProfit,
      taxLiability: tax,
      effectiveRate: 30,
      slabs: []
    };
  } else {
    taxData = calculatePersonalTax(netProfit);
  }

  // Generate PDF
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  const formatCurrency = (amount: number) => amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const formatNegative = (amount: number) => `(LKR ${formatCurrency(Math.abs(amount))})`;
  const formatPositive = (amount: number) => `LKR ${formatCurrency(amount)}`;

  const drawPageHeader = (title: string, isOverflow = false) => {
    doc.save();
    // Header background
    doc.rect(0, 0, doc.page.width, 140).fill('#3730a3');
    doc.circle(doc.page.width, 0, 250).fill('#4f46e5'); // Decorative circle
    
    // Header text
    doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('TaxMe', 50, 40);
    doc.fontSize(14).font('Helvetica').text(isOverflow ? `${title} (Continued)` : title, 50, 75);
    doc.fontSize(10).text(`Year of Assessment: ${userData?.period_code || '2025/2026'}`, doc.page.width - 250, 75, { align: 'right', width: 200 });

    // Taxpayer Info Box
    doc.roundedRect(50, 110, doc.page.width - 100, 65, 5).fill('#f3f4f6');
    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text('Taxpayer Information', 60, 120);
    
    doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
      .text('Profile Name', 60, 140)
      .text('Account Type', 220, 140)
      .text('TIN', 360, 140)
      .text('Generated', 460, 140);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827')
      .text(userData?.name || req.user!.name || 'N/A', 60, 152)
      .text(userType.replace('_', ' ').toUpperCase(), 220, 152)
      .text(userData?.tin || 'Not Provided', 360, 152)
      .text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 460, 152);
    
    doc.restore();
    return 200; // Return current Y position
  };

  const startNewPage = (title: string, isOverflow = false) => {
    doc.addPage();
    return drawPageHeader(title, isOverflow);
  };

  const drawSectionHeader = (title: string, y: number, isMain = false) => {
    if (isMain) {
      doc.rect(50, y, doc.page.width - 100, 25).fill('#f3f4f6');
      doc.fillColor('#3730a3').fontSize(14).font('Helvetica-Bold').text(title.toUpperCase(), 60, y + 6);
      return y + 35;
    }
    doc.rect(50, y, 4, 16).fill('#4f46e5');
    doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text(title, 60, y + 2);
    return y + 22;
  };

  const drawRow = (label: string, value: string, y: number, isBold = false, valueColor = '#111827', fontSize = 10) => {
    doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize).fillColor('#4b5563').text(label, 50, y);
    doc.fillColor(valueColor).font(isBold ? 'Helvetica-Bold' : 'Helvetica').text(value, doc.page.width - 200, y, { align: 'right', width: 150 });
    return y + (fontSize + 6);
  };

  let y = drawPageHeader(reportType === 'full' ? 'Comprehensive Financial Report' : 'Financial Statement');

  // Profit & Loss Statement
  if (reportType === 'full' || reportType === 'pnl') {
    y += 10;
    y = drawSectionHeader('Profit & Loss Statement', y, true);
    y += 5;

    y = drawSectionHeader('Revenue', y);
    y = drawRow('Business Revenue', formatPositive(totalRevenue), y);
    y = drawRow('Asset / Other Income', formatPositive(totalAssetIncome), y);
    if (annualSalary > 0) {
      y = drawRow('Employment Income', formatPositive(annualSalary), y);
    }
    y += 5;
    y = drawRow('Total Income', formatPositive(totalRevenue + totalAssetIncome + annualSalary), y, true, '#059669');
    
    y += 15;
    y = drawSectionHeader('Expenses', y);
    y = drawRow('Operating Expenses', formatPositive(totalExpenses), y);
    y += 5;
    y = drawRow('Total Expenses', formatPositive(totalExpenses), y, true, '#dc2626');

    y += 20;
    // Net Profit Block
    doc.roundedRect(50, y, doc.page.width - 100, 50, 5).fill('#059669');
    doc.fillColor('white').fontSize(10).font('Helvetica').text('Net Profit / (Loss)', 65, y + 10);
    doc.fontSize(18).font('Helvetica-Bold').text(`LKR ${formatCurrency(netProfit)}`, 65, y + 25);
    
    y += 70;
    
    // Transaction Details
    y = drawSectionHeader('Transaction Details', y);
    
    // Table Header
    doc.rect(50, y, doc.page.width - 100, 20).fill('#3730a3');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
       .text('DATE', 60, y + 5)
       .text('VENDOR / SOURCE', 150, y + 5)
       .text('CATEGORY', 350, y + 5)
       .text('AMOUNT (LKR)', doc.page.width - 150, y + 5, { align: 'right', width: 90 });
    y += 25;

    // Table Rows
    const recentTx = transactions.slice(0, 50); // Increased limit
    recentTx.forEach((tx: any) => {
      if (y > doc.page.height - 80) {
        y = startNewPage('Profit & Loss Statement', true);
        // Redraw table header on new page
        doc.save();
        doc.rect(50, y, doc.page.width - 100, 20).fill('#3730a3');
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
           .text('DATE', 60, y + 5)
           .text('VENDOR / SOURCE', 150, y + 5)
           .text('CATEGORY', 350, y + 5)
           .text('AMOUNT (LKR)', doc.page.width - 150, y + 5, { align: 'right', width: 90 });
        doc.restore();
        y += 25;
      }
      doc.fillColor('#4b5563').fontSize(9).font('Helvetica')
         .text(tx.date, 60, y)
         .text(tx.description || 'N/A', 150, y)
         .text(tx.category || 'Uncategorized', 350, y);
      
      const amountStr = tx.type === 'revenue' ? `+ ${formatCurrency(tx.amount)}` : `- ${formatCurrency(tx.amount)}`;
      const amountColor = tx.type === 'revenue' ? '#059669' : '#dc2626';
      doc.fillColor(amountColor).font('Helvetica-Bold').text(amountStr, doc.page.width - 150, y, { align: 'right', width: 90 });
      y += 15;
    });
  }

  // Balance Sheet Summary
  if (reportType === 'full' || reportType === 'bs') {
    if (y > doc.page.height - 250) {
      y = startNewPage('Balance Sheet');
    } else {
      y += 30;
      y = drawSectionHeader('Balance Sheet', y, true);
    }
    y += 5;

    y = drawSectionHeader('Assets', y);
    let totalAssetsValue = 0;
    if (assets.length === 0) {
      doc.fillColor('#6b7280').fontSize(10).font('Helvetica').text('No assets recorded.', 50, y);
      y += 20;
    } else {
      assets.forEach((a: any) => {
        y = drawRow(`${a.name} (${a.type})`, formatPositive(a.value), y);
        totalAssetsValue += a.value;
      });
    }

    y += 15;
    y = drawSectionHeader('Liabilities', y);
    y = drawRow('Total Liabilities', formatPositive(0), y);

    y += 20;
    y = drawSectionHeader('Equity Summary', y);
    y = drawRow('Total Assets', formatPositive(totalAssetsValue), y);
    y = drawRow('Less: Total Liabilities', formatPositive(0), y);

    y += 20;
    // Total Equity Block
    doc.roundedRect(50, y, doc.page.width - 100, 50, 5).fill('#4f46e5');
    doc.fillColor('white').fontSize(10).font('Helvetica').text('Total Equity (Net Worth)', 65, y + 10);
    doc.fontSize(18).font('Helvetica-Bold').text(`LKR ${formatCurrency(totalAssetsValue)}`, 65, y + 25);
  }

  // Tax Calculation
  if (reportType === 'full' || reportType === 'tax') {
    y = startNewPage('Tax Computation Report');
    y += 5;

    y = drawSectionHeader('Income Summary', y);
    y = drawRow('Gross Revenue', formatPositive(totalRevenue), y, false, '#111827', 9);
    y = drawRow('Asset / Other Income', formatPositive(totalAssetIncome), y, false, '#111827', 9);
    if (annualSalary > 0) {
      y = drawRow('Employment Income', formatPositive(annualSalary), y, false, '#111827', 9);
    }
    y = drawRow('Less: Deductible Expenses', formatNegative(totalExpenses), y, false, '#dc2626', 9);
    y += 2;
    y = drawRow('Net Income', formatPositive(netProfit), y, true, '#111827', 10);

    y += 10;
    y = drawSectionHeader(userType === 'pvt_ltd' ? 'Corporate Tax Computation' : 'Personal Tax Computation', y);
    y = drawRow('Total Income', formatPositive(netProfit), y, false, '#111827', 9);
    
    if (userType !== 'pvt_ltd') {
      y = drawRow('Less: Personal Relief', formatNegative(1800000), y, false, '#dc2626', 9);
      if (rentRelief > 0) {
        y = drawRow('Less: Rent Relief (25%)', formatNegative(rentRelief), y, false, '#dc2626', 9);
      }
      y += 2;
      y = drawRow('Taxable Income', formatPositive(taxData.taxableIncome), y, true, '#4f46e5', 10);
      
      y += 10;
      y = drawSectionHeader('Slab-wise Tax Breakdown', y);
      
      // Table Header
      doc.rect(50, y, doc.page.width - 100, 14).fill('#3730a3');
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
         .text('#', 60, y + 3)
         .text('INCOME SLAB (LKR)', 100, y + 3)
         .text('RATE', 300, y + 3)
         .text('TAX (LKR)', doc.page.width - 150, y + 3, { align: 'right', width: 90 });
      y += 16;

      if (taxData.slabs && taxData.slabs.length > 0) {
        taxData.slabs.forEach((slab: any, idx: number) => {
          doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
             .text((idx + 1).toString(), 60, y)
             .text(formatCurrency(slab.amount), 100, y);
          doc.fillColor('#4f46e5').text(`${slab.rate}%`, 300, y);
          doc.fillColor('#111827').font('Helvetica-Bold').text(formatCurrency(slab.tax), doc.page.width - 150, y, { align: 'right', width: 90 });
          y += 12;
        });
      } else {
        doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text('No tax liability (Income below threshold)', 60, y);
        y += 12;
      }
      
      doc.rect(50, y, doc.page.width - 100, 14).fill('#f3f4f6');
      doc.fillColor('#111827').fontSize(8).font('Helvetica-Bold').text('Total Tax', 300, y + 3);
      doc.fillColor('#4f46e5').text(`LKR ${formatCurrency(taxData.taxLiability)}`, doc.page.width - 150, y + 3, { align: 'right', width: 90 });
      y += 18;
    } else {
      y += 2;
      y = drawRow('Taxable Income', formatPositive(taxData.taxableIncome), y, true, '#4f46e5', 10);
      y += 10;
      y = drawRow('Corporate Tax Rate', '30%', y, false, '#111827', 9);
      y += 10;
    }

    // Total Tax Liability Block
    doc.roundedRect(50, y, doc.page.width - 100, 40, 5).fill('#312e81');
    doc.fillColor('white').fontSize(9).font('Helvetica').text('Total Tax Liability', 65, y + 8);
    doc.fontSize(16).font('Helvetica-Bold').text(`LKR ${formatCurrency(taxData.taxLiability)}`, 65, y + 20);
    y += 50;

    y = drawRow('Effective Tax Rate', `${taxData.effectiveRate.toFixed(1)}%`, y, false, '#4f46e5', 9);
    y += 10;

    // Quarterly Installment Schedule
    y = drawSectionHeader('Quarterly Installment Schedule', y);
    doc.rect(50, y, doc.page.width - 100, 14).fill('#3730a3');
    doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
       .text('#', 60, y + 3)
       .text('DUE DATE & PERIOD', 100, y + 3)
       .text('AMOUNT (LKR)', doc.page.width - 150, y + 3, { align: 'right', width: 90 });
    y += 16;

    const installments = calculateInstallments(taxData.taxLiability);
    installments.forEach((inst: any, idx: number) => {
      doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
         .text((idx + 1).toString(), 60, y)
         .text(inst.period, 100, y);
      doc.fillColor('#111827').font('Helvetica-Bold').text(formatCurrency(inst.amount), doc.page.width - 150, y, { align: 'right', width: 90 });
      y += 12;
    });

    y += 10;
    // Disclaimer
    doc.roundedRect(50, y, doc.page.width - 100, 35, 5).fill('#fef3c7');
    doc.fillColor('#92400e').fontSize(8).font('Helvetica-Bold').text('Disclaimer', 60, y + 8);
    doc.font('Helvetica').fontSize(7).text('This report is auto-generated for reference purposes only. Please consult a qualified tax professional before filing with the Inland Revenue Department.', 60, y + 18);
  }

  // Add footer to all pages
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
    doc.text('Generated by TaxMe — Sri Lanka Tax Suite', 50, doc.page.height - 40);
    doc.text(`Page ${i + 1} of ${pages.count}`, doc.page.width - 100, doc.page.height - 40, { align: 'right', width: 50 });
  }

  doc.end();
});


export default router;
