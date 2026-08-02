const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');
code = code.replace(
  "Info, X} from 'lucide-react';",
  "Info, X, Heart, MessageSquare, Users} from 'lucide-react';"
);
fs.writeFileSync('src/components/StudentPanel.tsx', code);
