const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 3000;
const url = "mongodb://127.0.0.1:27017/jeevan";

// Set up view engine and static folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'res', 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Configure express-session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Database Connection
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch(error => console.error(error));

// Profile Schema and Model
const profileSchema = new mongoose.Schema({
  name: String,
  mobileNo: String,
  donationOrWastage: String,
  address: String,
  message: String,
  image: String // Add the image field to the schema
});
const Profile = mongoose.model('Profile', profileSchema);

// User Schema and Model
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const User = mongoose.model('User', userSchema);

// Middleware for Authentication
const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};
const requireAuthe = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/adminlogin');
  }
};

// Routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const newUser = new User({ email, password });
    await newUser.save();
    res.render('addprofile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });

  if (user) {
    req.session.isAuthenticated = true;
    res.redirect('/profile/add');
  } else {
    res.status(401).send('Unauthorized');
  }
});
app.get('/adminreg', (req, res) => {
  res.render('adminreg');
});

app.post('/adminreg', async (req, res) => {
  try {
    const { email, password } = req.body;
    const newUser = new User({ email, password });
    await newUser.save();
    res.render('profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/adminlogin', (req, res) => {
  res.render('adminlogin');
});

app.post('/adminlogin', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });

  if (user) {
    req.session.isAuthenticated = true;
    res.redirect('/profile');
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.get('/profile',requireAuthe,async (req, res) => {
  try {
    const profiles = await Profile.find();
    console.log(profiles);
    res.render('profile', { profiles: profiles });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/profile/add', requireAuth, (req, res) => {
  res.render('addProfile');
});

// Handle form data and file upload
app.post('/profile/add',  async (req, res) => {
  try {
    const { name, mobileNo, donationOrWastage, address, message } = req.body;

    // Create a new Profile object
    const newProfile = new Profile({
      name,
      mobileNo,
      donationOrWastage,
      address,
      message,
  
    });

    // Save the new profile to the database
    const savedProfile = await newProfile.save();
    console.log('New profile added:', savedProfile);

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
