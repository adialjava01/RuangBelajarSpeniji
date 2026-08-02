const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

// Replace the Lucide Map import
code = code.replace(
  "Home, Heart, X, Briefcase, Map, Plus, Trash2, MapPin",
  "Home, Heart, X, Briefcase, Map as MapIcon, Plus, Trash2, MapPin"
);

// Replace uses of Map icon
code = code.replace(/<Map className=/g, "<MapIcon className=");
code = code.replace(/<Map \/>/g, "<MapIcon />");

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
