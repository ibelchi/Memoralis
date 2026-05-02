async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/artworks');
    const data = await res.json();
    console.log('API Response:', JSON.stringify(data, null, 2).slice(0, 500));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
main();
