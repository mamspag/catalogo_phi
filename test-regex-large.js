const imgData = 'data:image/jpeg;base64,' + 'A'.repeat(5 * 1024 * 1024);
console.time('regex');
const matches = imgData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
console.timeEnd('regex');
console.log('Matches:', matches ? true : false);
