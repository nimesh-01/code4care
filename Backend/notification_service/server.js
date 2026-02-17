require('dotenv').config()
const app = require('./src/app')

app.listen(3005, () => {
    console.log("Notificatin service is ruuning on port 3006")
})