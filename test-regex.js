const crypto = require('crypto');
const img = { type: 'base64', data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' };
const matches = img.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
console.log('Matches:', matches ? true : false);
if (matches) {
  console.log('Matches[1]:', matches[1]);
  const extension = matches[1].split('/')[1];
  console.log('Extension:', extension);
}
