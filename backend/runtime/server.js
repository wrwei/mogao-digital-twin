const app = require('./app');

const PORT = process.env.PORT || 8008;

app.listen(PORT, () => {
    console.log('============================================');
    console.log('Mogao Digital Twin - Node.js Backend');
    console.log('============================================');
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('============================================');
});
