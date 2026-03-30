import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Category {
  _id: string;
  name: string;
  parentCategory?: string;
}

const AddCategory: React.FC = () => {
  const [name, setName] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [type, setType] = useState<'main' | 'sub'>('main');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const url = editingCategory 
        ? `http://localhost:5000/api/categories/${editingCategory._id}`
        : 'http://localhost:5000/api/categories';
      
      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          parentCategory: parentCategory || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Erreur lors de l\'opération');
        return;
      }

      setSuccess(editingCategory ? 'Catégorie modifiée avec succès !' : 'Catégorie ajoutée avec succès !');
      setName('');
      setParentCategory('');
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      setError('Erreur lors de l\'opération');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setSuccess('Catégorie supprimée avec succès !');
      fetchCategories();
    } catch (err) {
      setError('Erreur lors de la suppression de la catégorie');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setType(category.parentCategory ? 'sub' : 'main');
    setParentCategory(category.parentCategory || '');
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setName('');
    setParentCategory('');
    setType('main');
  };

  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.parentCategory === parentId);
  };

  // Pagination logic
  const mainCategories = categories.filter(cat => !cat.parentCategory);
  const totalPages = Math.ceil(mainCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = mainCategories.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-6">
        {editingCategory ? 'Modifier une catégorie' : 'Ajouter une catégorie ou sous-catégorie'}
      </h2>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4 flex gap-6 items-center">
          <label className="font-medium">Type de catégorie :</label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="main"
              checked={type === 'main'}
              onChange={() => {
                setType('main');
                setParentCategory('');
              }}
            />
            Grande catégorie
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="sub"
              checked={type === 'sub'}
              onChange={() => setType('sub')}
            />
            Sous-catégorie
          </label>
        </div>
        {type === 'sub' && (
          <div className="mb-4">
            <label className="block mb-2 font-medium">Catégorie parente</label>
            <select
              value={parentCategory}
              onChange={e => setParentCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required={type === 'sub'}
            >
              <option value="">Sélectionnez une grande catégorie</option>
              {categories.filter(cat => !cat.parentCategory).map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}
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
        {error && <div className="mb-2 text-red-600">{error}</div>}
        {success && <div className="mb-2 text-green-600">{success}</div>}
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
          >
            {editingCategory ? 'Modifier' : 'Ajouter'}
          </button>
          {editingCategory && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Liste des catégories</h3>
        <div className="space-y-4">
          {currentCategories.map(category => (
            <div key={category._id} className="border rounded p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{category.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              {getSubcategories(category._id).length > 0 && (
                <div className="ml-4 mt-2 space-y-2">
                  {getSubcategories(category._id).map(subcategory => (
                    <div key={subcategory._id} className="flex justify-between items-center border-l-2 pl-4">
                      <span>{subcategory.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(subcategory)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(subcategory._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              Précédent
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCategory; 