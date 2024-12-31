import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { FaShoppingCart, FaCheck, FaMinus, FaPlus,FaCoffee,FaDrumstickBite,FaIceCream,FaBreadSlice } from 'react-icons/fa';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [note, setNote] = useState('');
  const cartRef = useRef(null);

  // Récupération des produits depuis l'API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('https://restosola.onrender.com/products');
        setProducts(response.data);
        setFilteredProducts(response.data); // Initialisation du tableau avec tous les produits
      } catch (error) {
        console.error('Erreur lors du chargement des produits :', error);
      }
    };

    fetchProducts();
  }, []);

  // Filtrage des produits par catégorie
  const filterProducts = (category) => {
    setSelectedCategory(category);

    if (category === 'Tous') {
      setFilteredProducts(products); // Affiche tous les produits lorsque "Tous" est sélectionné
    } else if (category) {
      setFilteredProducts(products.filter((product) => product.category === category)); // Filtre par catégorie
    } else {
      setFilteredProducts(products); // Affiche tous les produits si la catégorie est vide
    }
  };

  // Ajouter un produit au panier
  const addToCart = useCallback((product) => {
    setCart((prevCart) => {
      const existingProductIndex = prevCart.findIndex((item) => item.id === product.id);
      let updatedCart;
      if (existingProductIndex !== -1) {
        updatedCart = [...prevCart];
        updatedCart[existingProductIndex] = {
          ...updatedCart[existingProductIndex],
          quantity: updatedCart[existingProductIndex].quantity + 1,
        };
      } else {
        updatedCart = [...prevCart, { ...product, quantity: 1 }];
      }
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  }, []);

  // Récupérer le panier depuis localStorage au chargement
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  // Retirer un produit du panier
  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const updatedCart = prevCart
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0);
      return updatedCart;
    });
  };

  // Calcul du total du panier
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  // Soumettre la commande
// Soumettre la commande
const submitOrder = async () => {
  try {
    const orderData = cart.map((item) => ({ id: item.id, quantity: item.quantity }));
    await axios.post('https://restosola.onrender.com/orders', { product_data: orderData, note });
    alert('Commande validée avec succès!');
    
    // Vider le panier et mettre à jour localStorage
    setCart([]);
    localStorage.removeItem('cart'); // Supprimer le panier de localStorage
    setIsCartOpen(false);
    setNote('');
  } catch (error) {
    console.error('Erreur lors de la validation de la commande :', error);
    alert('Erreur lors de la validation de la commande.');
  }
};
  // Fermeture du panier si on clique à l'extérieur
  const handleOutsideClick = (event) => {
    if (cartRef.current && !cartRef.current.contains(event.target)) {
      setIsCartOpen(false);
    }
  };

  useEffect(() => {
    if (isCartOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCartOpen]);

  return (
    <div className="relative p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Liste des Produits</h2>

      {/* Filtres par catégorie */}
      <div className="mb-4 flex gap-3 overflow-x-auto py-2 justify-center">
        {[
          { label: 'Tous', icon: <FaShoppingCart /> },
          { label: 'Boissons', icon: <FaCoffee /> },
          { label: 'Nourriture', icon: <FaDrumstickBite /> },
          { label: 'Desserts', icon: <FaIceCream /> },
          { label: 'Snacks', icon: <FaBreadSlice /> },
        ].map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => filterProducts(label)}
            className={`flex flex-col items-center px-4 py-2 text-sm transition-all whitespace-nowrap ${
              selectedCategory === label
                ? 'bg-blue-500 text-white scale-110 rounded-full'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            <span className="text-2xl">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Liste des produits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-sm p-2 transition-transform hover:scale-105 hover:shadow-lg flex flex-col justify-between"
          >
            <div className="flex justify-center mb-3">
              <img
                src={`https://restosola.onrender.com${product.image}`}
                alt={product.name}
                className="w-40 h-40 object-cover rounded-lg"
              />
            </div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
              <p className="text-gray-800 font-bold">{product.price} f</p>
            </div>
            <div className="flex justify-between items-center text-sm mt-auto">
              {selectedCategory === '' && <p className="text-gray-600">{product.category}</p>}
              <button
                onClick={() => addToCart(product)}
                className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-all"
              >
                <FaShoppingCart className="inline text-xl" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Panier flottant */}
      {cart.length > 0 && (
        <div
          className="fixed bottom-8 right-8 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 shadow-lg flex items-center cursor-pointer"
          onClick={() => setIsCartOpen(!isCartOpen)}
        >
          <div className="relative">
            <FaShoppingCart className="text-4xl" />
            <span className="absolute bottom-6 left-6 bg-red-600 text-base rounded-full px-2 py-0">
              {cart.length}
            </span>
          </div>
        </div>
      )}

      {/* Popup panier */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={cartRef} className="bg-white w-96 rounded-lg shadow-lg p-4 relative">
            <button
              className="absolute top-2 right-2 text-black text-lg"
              onClick={() => setIsCartOpen(false)}
            >
              ✖
            </button>
            <h2 className="text-xl font-bold mb-4">Panier</h2>
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-gray-100 rounded p-2 mb-2 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p>Prix : {item.price} cfa</p>
                  <p>Quantité : {item.quantity}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    <FaMinus />
                  </button>
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <p className="text-right font-bold">Total : {calculateTotal()} cfa</p>
            </div>

            {/* Ajout de la note */}
            <div className="mt-4">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ajouter une note"
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>

            <button
              onClick={submitOrder}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full flex justify-center items-center transition duration-200"
            >
              <FaCheck className="mr-2" />
              Valider la commande
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
