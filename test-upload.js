async function test() {
  const payload = {
    brand: 'home',
    name: 'Test Product',
    sku: 'TEST-001',
    features: 'Test',
    videos: [],
    images: [{
      type: 'base64',
      url: '',
      data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    }]
  };

  const res = await fetch('http://localhost:3000/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const text = await res.text();
  console.log('Response:', res.status, text);
}

test();
