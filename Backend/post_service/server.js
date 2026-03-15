require('dotenv').config()
const app = require('./src/app')
const connectDb = require('./src/db/db')

const PORT = process.env.PORT || 3007

async function start() {
  try {
    await connectDb()
    app.listen(PORT, () => {
      console.log(`Post service listening on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to initialize post service', error)
    process.exit(1)
  }
}

start()
