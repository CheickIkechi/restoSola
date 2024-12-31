// src/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element, ...rest }) => {
  const userId = localStorage.getItem('userId');
  const lastLogin = localStorage.getItem('lastLogin');

  // Vérifier si l'utilisateur est connecté et si la dernière connexion est dans les 12 heures
  const isLoggedIn = userId && lastLogin && (Date.now() - lastLogin < 12 * 60 * 60 * 1000);

  return isLoggedIn ? element : <Navigate to="/login" />;
};

export default PrivateRoute;
