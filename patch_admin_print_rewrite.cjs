const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const regex = /const htmlDocument = \`[\s\S]*?<\/html>[\s\S]*?\`;/;

const newHtmlDocument = `const htmlDocument = \`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Data Siswa</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 0; background: white; }
          
          /* Spacers for repeating margins */
          .spacer-top { height: 15mm; }
          .spacer-bottom { height: 15mm; }
          
          .content-wrapper { padding: 0 15mm; }

          .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { font-size: 22px; margin: 0; text-transform: uppercase; color: #1e3a8a; letter-spacing: 1px; line-height: 1.15; }
          .header h2 { font-size: 22px; color: #2563eb; font-weight: 900; margin: 4px 0 0 0; letter-spacing: 1px; line-height: 1.15; }
          .header-divider { width: 60px; height: 4px; background-color: #3b82f6; margin: 8px auto; border-radius: 2px; }
          .header h3 { font-size: 15px; margin: 0; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.15; }
          
          .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .data-table thead { display: table-header-group; }
          .data-table tr { page-break-inside: avoid; }
          .data-table th, .data-table td { border: 1px solid #94a3b8; padding: 8px 10px; }
          .data-table th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; text-align: left; font-size: 12px; }
          
          .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 14px; margin-bottom: 20px; }
          
          .print-footer { position: fixed; bottom: 5mm; left: 15mm; right: 15mm; text-align: center; font-size: 11px; color: #64748b; padding-top: 5px; border-top: 1px solid #e2e8f0; }
          
          /* Main structural table that ensures margins on every page */
          .layout-table { width: 100%; border-collapse: collapse; border: none; }
          .layout-table > thead > tr > td, .layout-table > tbody > tr > td, .layout-table > tfoot > tr > td { border: none; padding: 0; }

          @media print {
            .no-print { display: none; }
          }
          @media screen {
            .print-footer { display: none; }
            body { padding: 20px; }
            .spacer-top, .spacer-bottom { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align:right; padding: 0 15mm;">
          <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
        </div>

        <table class="layout-table">
          <thead>
            <tr><td><div class="spacer-top"></div></td></tr>
          </thead>
          <tbody>
            <tr><td>
              <div class="content-wrapper">
                <div class="header">
                  <h1>DAFTAR NAMA AKUN BELAJAR</h1>
                  <h2>SMPN 1 BEJI</h2>
                  <div class="header-divider"></div>
                  <h3>Kelas: \${className}</h3>
                </div>
                
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width:50px;text-align:center;">No</th>
                      <th>Nama Lengkap</th>
                      <th style="width:50px;text-align:center;">L/P</th>
                      <th style="width:120px;text-align:center;">NIS (User)</th>
                      <th>Email (Pass)</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${rows}
                  </tbody>
                </table>
              </div>
            </td></tr>
          </tbody>
          <tfoot>
            <tr><td><div class="spacer-bottom"></div></td></tr>
          </tfoot>
        </table>

        <div class="print-footer">
          SMPN 1 BEJI
        </div>
      </body>
      </html>
    \`;`;

content = content.replace(regex, newHtmlDocument);
fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log("AdminPanel.tsx replaced successfully");
