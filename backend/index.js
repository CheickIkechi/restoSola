const cors = require('cors');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000; // Utilisation du port d'environnement de Render ou 3000 par défaut

// Middleware
app.use(cors());  // Permet à n'importe quelle origine de faire des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Définir le chemin d'accès aux fichiers (pour Render)
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}
app.use('/uploads', express.static(UPLOADS_DIR));

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
  });
};
createTables();

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR); // Utilisation du répertoire uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Categories list (static for simplicity)
const categories = ['Boissons', 'Nourriture', 'Desserts', 'Collations'];

// Routes

// Add a product
app.post('/products', upload.single('image'), (req, res) => {
  const { name, category, price } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!categories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  db.run(
    `INSERT INTO products (name, category, price, image) VALUES (?, ?, ?, ?)`,
    [name, category, parseFloat(price), image],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ id: this.lastID });
      }
    }
  );
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
  console.log(`Demande de suppression du produit avec l'ID : ${id}`);

  db.get('SELECT image FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Erreur lors de la récupération du produit :', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      console.warn('Produit introuvable dans la base de données.');
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    const imagePath = path.join(__dirname, row.image.startsWith('/') ? row.image.slice(1) : row.image);
    console.log('Chemin de l\'image à supprimer :', imagePath);

    db.get('SELECT * FROM orders WHERE product_data LIKE ?', [`%${id}%`], (err, orderRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (orderRow) {
        db.run('UPDATE products SET is_deleted = 1 WHERE id = ?', [id], (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(200).json({ message: 'Produit supprimé avec succès.' });
        });
      } else {
        db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
          if (err) {
            console.error('Erreur lors de la suppression du produit dans la base de données :', err.message);
            return res.status(500).json({ error: err.message });
          }
          if (this.changes === 0) {
            console.warn('Produit non trouvé dans la base de données lors de la suppression.');
            return res.status(404).json({ error: 'Produit non trouvé.' });
          }

          if (fs.existsSync(imagePath)) {
            fs.unlink(imagePath, (err) => {
              if (err) {
                console.error('Erreur lors de la suppression de l\'image :', err.message);
              } else {
                console.log('Image supprimée avec succès.');
              }
            });
          } else {
            console.warn('Fichier image introuvable :', imagePath);
          }

          res.status(200).json({ message: 'Produit supprimé avec succès.' });
        });
      }
    });
  });
});

// Upload an image separately
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
