import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrderListByDate = () => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredProductOrders, setFilteredProductOrders] = useState({});
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:3000/orders');
        setOrders(response.data || []);
      } catch (err) {
        setError('Une erreur est survenue lors de la récupération des commandes.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filterOrders = () => {
    if (!orders.length) return;
  
    const start = new Date(startDate);
    const end = new Date(endDate);
  
    const dateFilteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= start && orderDate <= end;
    });
  
    const productFilteredOrders = dateFilteredOrders.filter((order) => {
      const includesProduct = order.product_data.some((product) => {
        const normalizedProductName = product.name?.toLowerCase().trim();
        const normalizedSearchTerm = productName.trim().toLowerCase();
        return normalizedProductName?.includes(normalizedSearchTerm);
      });
      return includesProduct || !productName.trim();
    });
  
    // Trier les commandes filtrées par date
    const sortedOrders = productFilteredOrders.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  
    // Regrouper les commandes par date
    const groupedOrders = sortedOrders.reduce((acc, order) => {
      const dateKey = new Date(order.created_at).toISOString().split('T')[0];
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(order);
      return acc;
    }, {});
  
    const sortedGroupedOrders = Object.entries(groupedOrders)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([date, orders]) => ({ date, orders }));
  
    setFilteredOrders(sortedGroupedOrders);
  
    // Mise à jour des ventes par produit uniquement si productName est non vide
    if (productName.trim()) {
      const productSales = productFilteredOrders.reduce((acc, order) => {
        order.product_data.forEach((product) => {
          const normalizedProductName = product.name?.toLowerCase().trim();
          if (normalizedProductName?.includes(productName.trim().toLowerCase())) {
            acc[product.name] = acc[product.name] || { quantity: 0, total: 0 };
            acc[product.name].quantity += product.quantity;
            acc[product.name].total += product.price * product.quantity;
          }
        });
        return acc;
      }, {});
      setFilteredProductOrders(productSales);
    } else {
      setFilteredProductOrders({}); // Réinitialiser les ventes si productName est vide
    }
  };
  

  useEffect(filterOrders, [orders, startDate, endDate, productName]);

  if (loading) return <div>Chargement des commandes...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-center">Commandes par Intervalle de Dates</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          filterOrders();
        }}
        className="flex justify-center items-center mb-6 space-x-4"
      >
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Date de début :
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md shadow-sm border-blue-400 border-2"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            Date de fin :
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md shadow-sm border-blue-400 border-2"
          />
        </div>
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
            Nom du produit :
          </label>
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Rechercher"
            className="mt-1 block w-full border-blue-400 border-2 rounded-md shadow-sm"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600">
          Filtrer
        </button>
      </form>

      {Object.keys(filteredProductOrders).length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold">Ventes de {productName}</h3>
          {Object.entries(filteredProductOrders).map(([productName, { quantity, total }]) => (
            <div key={productName} className="bg-white shadow-md rounded-lg p-6 border">
              <p>Quantité vendue : {quantity}</p>
              <p>Total généré : {total.toLocaleString('fr-FR')} cfa</p>
            </div>
          ))}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="text-gray-500 text-center">
          Aucune commande trouvée pour la période sélectionnée.
        </div>
      ) : (
        <div className="space-y-8">
          {filteredOrders.map(({ date, orders }) => (
            <div key={date} className="bg-white shadow-md rounded-lg p-6 border">
              <h3 className="text-xl font-bold mb-4">Commandes du {new Date(date).toLocaleDateString()}</h3>
              <table className="table-auto w-full border-collapse border border-gray-200 text-sm mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Commande</th>
                    <th className="border px-4 py-2 text-left">Date</th>
                    <th className="border px-4 py-2 text-left">Produits</th>
                    <th className="border px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{order.id}</td>
                      <td className="border px-4 py-2">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="border px-4 py-2">
                        {order.product_data.map((product, index) => (
                          <div key={`${order.id}-${index}`}>
                            {product.name || `Produit ID: ${product.id}`} x{product.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="border px-4 py-2 text-right">
                        {order.product_data
                          .reduce((acc, product) => acc + product.price * product.quantity, 0)
                          .toLocaleString('fr-FR')}{' '}
                        cfa
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right font-bold">
                Total du jour :{' '}
                {orders
                  .reduce(
                    (dayTotal, order) =>
                      dayTotal +
                      order.product_data.reduce(
                        (orderTotal, product) => orderTotal + product.price * product.quantity,
                        0
                      ),
                    0
                  )
                  .toLocaleString('fr-FR')}{' '}
                cfa
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderListByDate;
