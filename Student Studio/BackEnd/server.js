const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const cors = require('cors'); // Importing cors module

const app = express();
app.options('*', cors()); // Pre-flight requests for all routes


// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000', // Allow only requests from this origin
  methods: 'GET,POST,PUT,DELETE,OPTIONS', // Allow specific HTTP methods
  allowedHeaders: 'Content-Type,Authorization', // Allow specific headers
}));

// Configure multer to store files in the 'uploads/' folder
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON data
app.use(express.json());

// Route to handle uploading and saving with the original filename
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  const fileName = file.originalname;
  const filePath = path.join(__dirname, 'uploads', fileName);

  // Move the file to the desired location with the original name
  fs.rename(file.path, filePath, (err) => {
    if (err) {
      return res.status(500).send('Error saving file.');
    }
    res.send({ fileName });
  });
});

// Route to handle updating an existing file
app.post('/update/:fileName', upload.none(), (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, 'uploads', fileName);
  const updatedData = req.body.updatedData;

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];

    // Converting JSON data to worksheet
    const newWorksheet = XLSX.utils.json_to_sheet(JSON.parse(updatedData), { header: 1 });
    workbook.Sheets[sheetName] = newWorksheet;

    // Writing back to the file
    XLSX.writeFile(workbook, filePath);

    res.send('File updated successfully.');
  } catch (err) {
    console.error('Error updating file:', err);
    res.status(500).send('Error updating file.');
  }
});

// Start the server
app.listen(3001, () => console.log('Server started on port 3001'));
