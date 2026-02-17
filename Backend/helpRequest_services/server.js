require('dotenv').config();
const app = require('./src/app');
const connectDb = require('./src/db/db');

const PORT = process.env.PORT || 3003;

connectDb();

app.listen(PORT, () => {
  console.log(`Help Request Service running on port ${PORT}`);
});
