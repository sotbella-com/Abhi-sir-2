// Debug script to check data structure
const fs = require('fs');

// Read the Homepage1.json file
const data = JSON.parse(fs.readFileSync('./Homepage1.json', 'utf8'));

console.log('=== DEBUGGING HOMEPAGE DATA ===\n');

// Check NEW-IN section (Hero)
console.log('NEW-IN (Hero) data:');
console.log(JSON.stringify(data.homePage['NEW-IN'], null, 2));

console.log('\n=== Checking button data ===');
data.homePage['NEW-IN'].forEach((item, index) => {
  console.log(`\nItem ${index + 1}:`);
  console.log(`- title: "${item.title}"`);
  console.log(`- href: "${item.href}"`);
  console.log(`- link: "${item.link}"`);
  console.log(`- alt: "${item.alt}"`);
  console.log(`- Has title for button: ${item.title && item.title.trim() !== ""}`);
  console.log(`- Has href for button: ${item.href && item.href.trim() !== ""}`);
});

console.log('\n=== Checking Best-Seller data ===');
data.homePage['Best-Seller'].forEach((item, index) => {
  console.log(`\nItem ${index + 1}:`);
  console.log(`- title: "${item.title}"`);
  console.log(`- href: "${item.href}"`);
  console.log(`- link: "${item.link}"`);
  console.log(`- alt: "${item.alt}"`);
  console.log(`- Has title for button: ${item.title && item.title.trim() !== ""}`);
  console.log(`- Has href for button: ${item.href && item.href.trim() !== ""}`);
});
