import React, { useRef, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const Sidebar = ({ setView, onClose, onLogout }) => {
  const sidebarRef = useRef(null);

  const handleClickOutside = (event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      onClose(); // Fermer le Sidebar si on clique à l'extérieur
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative min-h-screen w-60 bg-gray-800 text-white flex flex-col"
      ref={sidebarRef}
    >
      {/* Bouton de fermeture dans le coin supérieur droit */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-gray-700 rounded-full"
      >
        <FaTimes />
      </button>

      <h2 className="text-2xl font-bold p-4 border-b border-gray-600">SolaResto</h2>

      <nav className="flex-grow">
        <ul className="space-y-2 p-4">
          <li>
            <button
              onClick={() => setView('ProductList')}
              className="block w-full text-left p-2 rounded hover:bg-gray-700"
            >
              Liste des Produits
            </button>
          </li>
          <li>
            <button
              onClick={() => setView('ProductForm')}
              className="block w-full text-left p-2 rounded hover:bg-gray-700"
            >
              Ajouter un Produit
            </button>
          </li>
          <li>
            <button
              onClick={() => setView('OrderList')}
              className="block w-full text-left p-2 rounded hover:bg-gray-700"
            >
              Liste des Commandes
            </button>
          </li>
        </ul>
      </nav>

      <button
        onClick={onLogout}
        className="bg-red-600 hover:bg-red-500 p-2 rounded-full m-4 text-white"
      >
        Déconnexion
      </button>
    </div>
  );
};

export default Sidebar;
