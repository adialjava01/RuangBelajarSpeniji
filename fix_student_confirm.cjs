const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

code = code.replace(
  "    if (window.confirm('Apakah kamu yakin ingin mengirim jurnal ini? Data tidak bisa diubah setelah dikirim.')) {\n      setIsSubmitting(true);",
  "    setIsSubmitting(true);"
);
code = code.replace(
  "      setIsSubmitting(false);\n    }\n  };",
  "    setIsSubmitting(false);\n  };"
);

fs.writeFileSync('src/components/StudentPanel.tsx', code);
