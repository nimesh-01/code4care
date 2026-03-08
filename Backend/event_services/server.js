require('dotenv').config();
const app = require('./src/app');
const connectDb = require('./src/db/db');

const PORT = process.env.PORT || 3008;

connectDb();

app.listen(PORT, () => {
  console.log(`Event Service running on port ${PORT}`);
});
