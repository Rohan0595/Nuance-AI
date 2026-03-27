const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

content = content.replace(/'Playfair Display', serif/g, "'Outfit', sans-serif");
content = content.replace(/'Inter', sans-serif/g, "'Plus Jakarta Sans', sans-serif");
content = content.replace(/'Georgia', serif/g, "'Outfit', sans-serif");
content = content.replace(/'Sora', sans-serif/g, "'Outfit', sans-serif");
// Just in case any other standard variants creeped in
content = content.replace(/Sora/g, "Outfit");
content = content.replace(/Playfair Display/g, "Outfit");
content = content.replace(/Inter/g, "Plus Jakarta Sans");

fs.writeFileSync('frontend/src/App.jsx', content);
console.log("Fonts updated successfully.");
