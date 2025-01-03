const cors = require('cors');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const bcrypt = require('bcrypt'); // Pour le hachage des mots de passe
require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 3000; // Utilisation du port d'environnement de Render ou 3000 par défaut

// Middleware
app.use(cors());  // Permet à n'importe quelle origine de faire des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup (utilisation de Render persistant pour SQLite)
const db = new sqlite3.Database(path.join(__dirname, 'sola_resto.db'), (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables
const createTables = () => {
  db.serialize(() => {
    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      is_deleted INTEGER DEFAULT 0, 
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_data TEXT NOT NULL, -- JSON string containing product IDs and quantities
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )`);
  });
};
createTables();

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Récupère le token depuis les variables d'environnement
const GITHUB_REPO = 'CheickIkechi/restoSola'; // Remplacez par votre nom d'utilisateur et le nom de votre dépôt

// Function to upload image to GitHub
const uploadImageToGitHub = async (file) => {
  const filePath = `uploads/${file.filename}`; // Chemin où l'image sera stockée dans le dépôt
  const content = fs.readFileSync(file.path); // Lire le fichier image
  const base64Content = content.toString('base64'); // Encoder le contenu en base64

  try {
    const response = await axios.put(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        message: `Upload ${file.filename}`, // Message de commit
        content: base64Content, // Contenu de l'image encodé en base64
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`, // Utilisation du format Bearer
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.content.download_url; // URL de l'image téléchargée
  } catch (error) {
    console.error("Erreur lors de l'upload de l'image :", error.response.data);
    throw new Error('Failed to upload image to GitHub.');
  }
};


const deleteImageFromGitHub = async (filePath) => {
  try {
    const githubApiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
    const response = await axios.get(githubApiUrl, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    });

    const sha = response.data.sha; // SHA de l'image sur GitHub

    await axios.delete(githubApiUrl, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
      data: {
        message: `Delete ${filePath}`,
        sha,
      },
    });

    console.log(`Image supprimée avec succès de GitHub : ${filePath}`);
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'image sur GitHub :`, error.response?.data || error.message);
    throw new Error('Failed to delete image from GitHub.');
  }
};


// Configuration de Multer pour stocker les fichiers dans le dossier 'uploads'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads'); // Assurez-vous que le dossier backend/uploads existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Crée le dossier s'il n'existe pas
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });



// Route pour la connexion d'un utilisateur
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const match = await bcrypt.compare(password, row.password); // Vérification du mot de passe
    if (match) {
      res.status(200).json({ message: 'Login successful', userId: row.id });
    } else {
      res.status(401).json({ error: 'Invalid username or password.' });
    }
  });
});

// Add a product
app.post('/products', upload.single('image'), async (req, res) => {
  const { name, category, price } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded.' });
  }

  try {
    const imageUrl = await uploadImageToGitHub(req.file);
    db.run(
      `INSERT INTO products (name, category, price, image) VALUES (?, ?, ?, ?)`,
      [name, category, parseFloat(price), imageUrl],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.status(201).json({ id: this.lastID });
        }
      }
    );
  } catch (error) {
    console.error("Erreur lors de l'upload de l'image :", error);
    res.status(500).json({ error: 'Failed to upload image to GitHub.' });
  }
});

// Get all products
app.get('/products', (req, res) => {
  db.all('SELECT * FROM products WHERE is_deleted = 0', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Add an order
app.post('/orders', (req, res) => {
  const { product_data, note } = req.body; // product_data is a JSON string
  db.run(
    `INSERT INTO orders (product_data, note) VALUES (?, ?)`,
    [JSON.stringify(product_data), note],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ id: this.lastID });
      }
    }
  );
});

// Get all orders
app.get('/orders', (req, res) => {
  db.all('SELECT * FROM orders', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const formattedOrders = rows.map((order) => {
        const productData = JSON.parse(order.product_data || '[]');
        return {
          ...order,
          product_data: productData,
        };
      });

      // Obtenir les détails des produits associés
      const productIds = formattedOrders
        .flatMap((order) => order.product_data.map((p) => p.id))
        .filter((id, index, self) => self.indexOf(id) === index);

      if (productIds.length === 0) {
        return res.json(formattedOrders);
      }

      db.all(
        `SELECT * FROM products WHERE id IN (${productIds.join(',')})`,
        [],
        (err, products) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            const ordersWithDetails = formattedOrders.map((order) => ({
              ...order,
              product_data: order.product_data.map((p) => ({
                ...p,
                ...products.find((prod) => prod.id === p.id),
              })),
            }));
            res.json(ordersWithDetails);
          }
        }
      );
    }
  });
});

// Delete a product
app.delete('/products/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT image FROM products WHERE id = ?', [id], async (err, row) => {
    if (err) {
      console.error('Erreur lors de la récupération du produit :', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    const imageUrl = row.image; // URL de l'image
    const filePath = `uploads/${path.basename(imageUrl)}`; // Déduire le chemin du fichier sur GitHub

    try {
      // Vérifiez si le produit est utilisé dans des commandes
      db.get('SELECT * FROM orders WHERE product_data LIKE ?', [`%${id}%`], async (err, orderRow) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (orderRow) {
          // Si utilisé dans une commande, marquez comme supprimé
          db.run('UPDATE products SET is_deleted = 1 WHERE id = ?', [id], (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: 'Produit marqué comme supprimé.' });
          });
        } else {
          // Sinon, supprimez complètement le produit
          db.run('DELETE FROM products WHERE id = ?', [id], async function (err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            try {
              // Supprimez l'image de GitHub
              await deleteImageFromGitHub(filePath);
              res.status(200).json({ message: 'Produit et image supprimés avec succès.' });
            } catch (error) {
              console.error('Erreur lors de la suppression de l\'image :', error.message);
              res.status(500).json({ error: 'Produit supprimé, mais échec de la suppression de l\'image.' });
            }
          });
        }
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image :', error.message);
      res.status(500).json({ error: 'Failed to delete image from GitHub.' });
    }
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});