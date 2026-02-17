require('dotenv').config();
const app = require('./src/app');
const connectDb=require('./src/db/db')

const PORT = process.env.PORT || 3002;
connectDb()
app.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
});
