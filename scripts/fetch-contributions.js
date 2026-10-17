const https = require('https');
const fs = require('fs');

function fetchContributions(username) {
  return new Promise((resolve, reject) => {
    https.get(`https://github.com/users/${username}/contributions`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const regex = /<td[^>]*data-date="([^"]+)"[^>]*data-level="([^"]+)"[^>]*>[\s\S]*?(?:<tool-tip[^>]*>([^<]+)<\/tool-tip>)?/g;
        const days = [];
        let m;
        while ((m = regex.exec(data)) !== null) {
          const date = m[1];
          const level = parseInt(m[2], 10);
          const tooltip = m[3] ? m[3].trim() : '';
          const countMatch = tooltip.match(/^([0-9]+)\s+contribution/);
          const count = countMatch ? parseInt(countMatch[1], 10) : (level > 0 ? level : 0);
          days.push({ date, level, count, tooltip });
        }

        const totalMatch = data.match(/([0-9,]+)\s+contributions?\s+in\s+/i);
        const totalContributions = totalMatch ? totalMatch[1] : 'Unknown';

        resolve({ days, totalContributions });
      });
    }).on('error', reject);
  });
}

(async () => {
  const result = await fetchContributions('mujawarswaliya483-sys');
  console.log('Total days fetched:', result.days.length);
  console.log('Total contributions headline:', result.totalContributions);
  const activeDays = result.days.filter(d => d.level > 0);
  console.log('Active days count:', activeDays.length);
  console.log('Active days details:');
  activeDays.forEach(d => console.log(`  ${d.date}: ${d.count} contributions (level ${d.level})`));
  fs.writeFileSync('contributions-cache.json', JSON.stringify(result, null, 2));
})();
