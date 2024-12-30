import React from 'react';

const Sidebar = ({ setView }) => {
  return (
    <div className="h-screen w-60 bg-gray-800 text-white flex flex-col">
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
    </div>
  );
};

export default Sidebar;
