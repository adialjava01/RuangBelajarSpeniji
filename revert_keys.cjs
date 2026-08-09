const fs = require('fs');
const files = [
  'src/components/AdminPanel.tsx',
  'src/components/TeacherPanel.tsx',
  'src/components/StudentPanel.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/key=\{\`\$\{(.+?)\.id\}_\$\{Math\.random\(\)\}\`\}/g, "key={$1.id}");
  content = content.replace(/key=\{\`\$\{(.+?)\}_\$\{Math\.random\(\)\}\`\}/g, "key={$1}");
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Reverted ${file}`);
}
