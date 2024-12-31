import React, { useState} from 'react';
import Sidebar from './Sidebar';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import OrderList from './OrderList';
import { FaBars } from 'react-icons/fa';

const Dashboard = () => {
  const [view, setView] = useState('ProductList');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const renderView = () => {
    switch (view) {
      case 'ProductList':
        return <ProductList />;
      case 'ProductForm':
        return <ProductForm />;
      case 'OrderList':
        return <OrderList />;
      default:
        return <ProductList />;
    }
  };

  return (
    <div className="flex bg-gray-100 h-screen">
      {/* Bouton d'ouverture visible uniquement si le Sidebar est fermé */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 bg-blue-500 text-white rounded-full absolute top-4 left-4 z-50"
        >
          <FaBars />
        </button>
      )}

      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar
          setView={(viewName) => {
            setView(viewName);
            setIsSidebarOpen(false); // Fermer le Sidebar après avoir cliqué sur une option
          }}
          onClose={() => setIsSidebarOpen(false)} // Fermer le Sidebar via le bouton de fermeture
          onLogout={() => {
            localStorage.removeItem('userId');
            localStorage.removeItem('lastLogin');
            setIsSidebarOpen(false); // Fermer le Sidebar après la déconnexion
          }}
        />
      )}

      {/* Main Content */}
      <div className="flex-grow p-6 bg-gray-100 h-screen">{renderView()}</div>
    </div>
  );
};

export default Dashboard;
