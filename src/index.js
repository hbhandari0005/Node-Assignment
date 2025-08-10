const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const schoolsRouter = require('./routes/schools');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/', schoolsRouter);

app.get('/', (req, res) => res.send('School Management API is running'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
