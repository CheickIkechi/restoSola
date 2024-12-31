import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductForm = () => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      // Simuler la récupération des catégories (ajouter une API pour récupérer dynamiquement si nécessaire)
      setCategories(['Boissons', 'Nourriture', 'Desserts', 'Collations']);
    };

    const fetchProducts = async () => {
      try {
        const response = await axios.get('https://restosola.onrender.com/products');
        setProducts(response.data);
      } catch (err) {
        setError('Erreur lors de la récupération des produits.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('image', image);

    try {
      await axios.post('https://restosola.onrender.com/products', formData);
      alert('Produit ajouté avec succès!');
      setName('');
      setCategory('');
      setPrice('');
      setImage(null);
      // Mettre à jour la liste des produits
      const response = await axios.get('https://restosola.onrender.com/products');
      setProducts(response.data);
    } catch (error) {
      console.error(error);
      alert(`Erreur lors de l'ajout du produit : ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      console.log(`Tentative de suppression du produit avec ID : ${productId}`);
      try {
        const response = await axios.delete(`https://restosola.onrender.com/products/${productId}`);
        console.log('Réponse du serveur :', response.data);
        alert('Produit supprimé avec succès!');
        // Mettre à jour la liste des produits
        setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId));
      } catch (error) {
        console.error('Erreur lors de la suppression :', error.message);
        console.error('Détails complets de l\'erreur :', error);
        alert('Erreur lors de la suppression du produit.');
      }
    }
  };
  

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Ajouter un Produit</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 shadow rounded">
        <div>
          <label className="block font-bold">Nom du Produit</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block font-bold">Catégorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold">Prix (cfa)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block font-bold">Image</label>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Ajouter
        </button>
      </form>

      <h2 className="text-2xl font-bold mt-8 mb-4">Liste des Produits</h2>
      {loading ? (
        <div>Chargement des produits...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-gray-500">Aucun produit trouvé.</div>
      ) : (
        <table className="table-auto w-full border-collapse border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Nom</th>
              <th className="border px-4 py-2">Catégorie</th>
              <th className="border px-4 py-2">Prix (cfa)</th>
              <th className="border px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{product.name}</td>
                <td className="border px-4 py-2">{product.category}</td>
                <td className="border px-4 py-2">{product.price.toLocaleString()}</td>
                <td className="border px-4 py-2 text-center">
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProductForm;
