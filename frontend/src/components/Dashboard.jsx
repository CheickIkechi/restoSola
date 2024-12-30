import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import OrderList from './OrderList';

const Dashboard = () => {
  const [view, setView] = useState('ProductList'); // Vue par défaut

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
    <div className="flex">
      {/* Sidebar */}
      <Sidebar setView={setView} />

      {/* Main Content */}
      <div className="flex-grow p-6 bg-gray-100">{renderView()}</div>
    </div>
  );
};

export default Dashboard;
