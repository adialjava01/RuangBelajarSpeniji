const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

// Extract the modal code
const modalCodeMatch = code.match(/      \{\/\* Modal Karir & Peminatan \*\/\}[\s\S]*?<\/button>\n            <\/div>\n          <\/div>\n        <\/div>\n      \)\}/);

if (modalCodeMatch) {
  const modalCode = modalCodeMatch[0];
  
  // Remove the modal from its current wrong position
  code = code.replace(modalCode, "");
  
  // Also remove the wrongly placed fragments like `<>` and `</>`
  code = code.replace(/return \(\n    <>\n([\s\S]*?)<\/div>\n    <\/>\n  \);\n\}/g, "return ($1</div>\n  );\n}");
  
  // Now place it at the end of the StudentPanel return statement
  // We need to find the end of StudentPanel.
  // It's a huge component, so we look for the last `    </div>\n  );\n}`
  const lastReturnIndex = code.lastIndexOf("    </div>\n  );\n}");
  if (lastReturnIndex !== -1) {
    code = code.substring(0, lastReturnIndex) + "    </div>\n" + modalCode + "\n    </>\n  );\n}";
    
    // Ensure the top level return of StudentPanel has <>
    const panelReturnIndex = code.lastIndexOf("  return (\n    <div className=\"space-y-6");
    if (panelReturnIndex !== -1) {
        code = code.substring(0, panelReturnIndex) + "  return (\n    <>\n    <div className=\"space-y-6" + code.substring(panelReturnIndex + 38);
    }
  }
  
  fs.writeFileSync('src/components/StudentPanel.tsx', code);
  console.log("Fixed StudentPanel modal placement.");
} else {
  console.log("Could not find modal code.");
}
