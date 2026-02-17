require('dotenv').config()
const app = require('./src/app')
const { connect } = require('./src/broker/broker')
const connectDb=require('./src/db/db')
connect()
connectDb()

app.listen(3000, () => {
    console.log("Server is running on port 3000");

})