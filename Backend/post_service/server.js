require('dotenv').config()
const app = require('./src/app')
const connectDb = require('./src/db/db')

connectDb()

const PORT = process.env.PORT || 3007

app.listen(PORT, () => {
  console.log(`Post service listening on port ${PORT}`)
})
