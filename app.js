// 1. declare express framework
const express = require('express');
const app = express();

// 2. cors and enable CORS (to share API with frontend)
const cors = require('cors');
// option 1: enable CORS for all frontend (flexible)
app.use(cors());
// option 2: enable CORS for 1 specific frontend (secure)
// var corsOptions = {
//     origin: 'http://localhost:3000',
//     // methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     // credentials: true,
//     optionsSuccessStatus: 200
// }
// app.use(cors(corsOptions));

// 3. declare & config body-parser (to get data from client request - frontend)
// option 1: old version of express => use body-parser
// const bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded())
// app.use
// option 2: (recommend) new version of express => use express.json() and express.urlencoded()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. declare & config mongoose (to connect to MongoDB)
const mongoose = require('mongoose');
const databaseURL = 'mongodb+srv://hoangduongbi6th:ev80pMUUS3UyXwoQ@cluster0.bxnwaex.mongodb.net/note_db'; // replace with your MongoDB URL
mongoose.connect(databaseURL)
.then(() => console.log('Connected to MongoDB successfully'))
.catch((error) => console.error('Error connecting to MongoDB:', error));

// 5. declare & config routes
const noteRouter = require('./api/routes/noteRoute'); 
noteRouter(app); // register routes with the app
const userRouter = require('./api/routes/userRoute');
userRouter(app);
const tagRouter = require('./api/routes/tagRoute');
tagRouter(app);

// 6. declare & register port
const port = process.env.PORT || 3001;

// 7. run server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});