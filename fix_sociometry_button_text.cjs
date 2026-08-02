const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

code = code.replace(
  "                    Kirim Pilihan\n                  </button>",
  "                    {mySociometry ? 'Simpan Perubahan' : 'Kirim Pilihan'}\n                  </button>"
);

fs.writeFileSync('src/components/StudentPanel.tsx', code);
