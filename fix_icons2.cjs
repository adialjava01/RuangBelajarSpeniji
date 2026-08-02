const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');
code = code.replace(
  "} from 'lucide-react';",
  ", Heart, MessageSquare, Users} from 'lucide-react';"
);
fs.writeFileSync('src/components/StudentPanel.tsx', code);
