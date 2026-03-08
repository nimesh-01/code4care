require('dotenv').config()
const app = require('./src/app')

const PORT = process.env.PORT || 3005

app.listen(PORT, () => {
    console.log(`Notification service is running on port ${PORT}`)
})