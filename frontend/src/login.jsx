// src/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Correction ici

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/login', {
        username,
        password,
      });
      // Stocker l'ID de l'utilisateur et le timestamp dans localStorage
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('lastLogin', Date.now());
      alert('Connexion réussie !');
      navigate('/'); // Rediriger vers le tableau de bord
    } catch (err) {
      setError('Nom d\'utilisateur ou mot de passe invalide.');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-lg font-bold mb-4">Connexion</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border border-gray-300 p-2 mb-4 w-full rounded"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 p-2 mb-4 w-full rounded"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
          Se connecter
        </button>
      </form>
    </div>
  );
};

export default Login;