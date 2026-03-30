import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Category {
  _id: string;
  name: string;
  parentCategory?: string | null;
  description?: string;
}

const FormationsIndex: React.FC = () => {
  const [name, setName] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Charger les catégories
  const fetchCategories = async () => {
    const res = await fetch('http://localhost:5000/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          parentCategory: parentCategory || null,
          description
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Erreur lors de la création de la catégorie');
        return;
      }
      setSuccess('Catégorie ajoutée avec succès !');
      setName('');
      setParentCategory('');
      setDescription('');
      fetchCategories();
    } catch (err) {
      setError('Erreur lors de la création de la catégorie');
    }
  };

  // Fonction pour afficher les catégories imbriquées
  const renderCategories = (parentId: string | null = null, level = 0) => {
    return categories
      .filter(cat => (cat.parentCategory ? cat.parentCategory === parentId : parentId === null))
      .map(cat => (
        <li key={cat._id} style={{ marginLeft: level * 20 }}>
          <span className="font-semibold">{cat.name}</span>
          {cat.description && <span className="text-gray-500 ml-2">({cat.description})</span>}
          <ul>{renderCategories(cat._id, level + 1)}</ul>
        </li>
      ));
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Ajouter une catégorie ou sous-catégorie</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Nom de la catégorie *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Catégorie parente</label>
          <select
            value={parentCategory}
            onChange={e => setParentCategory(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Aucune (grande catégorie)</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        {success && <div className="mb-2 text-green-600">{success}</div>}
        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
        >
          Ajouter
        </button>
      </form>
      <hr className="my-8" />
      <h3 className="text-xl font-bold mb-4">Catégories existantes</h3>
      <ul className="list-disc ml-4">
        {renderCategories()}
      </ul>
    </div>
  );
};

export default FormationsIndex; 