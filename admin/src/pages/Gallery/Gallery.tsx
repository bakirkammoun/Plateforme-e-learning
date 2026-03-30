import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumb';

interface Image {
  _id: string;
  category: string;
  imageUrl: string;
}

const Gallery = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('Langues');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Langues');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const categories = ['Langues', 'Informatique', 'Concours'];

  const fetchImages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/gallery');
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Erreur lors de la récupération des images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('category', selectedCategory);

    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/gallery', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchImages();
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      toast.success('Image téléchargée avec succès');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/gallery/${id}`);
      await fetchImages();
      toast.success('Image supprimée avec succès');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error('Erreur lors de la suppression de l\'image');
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(
    (image) => selectedTab === image.category
  );

  return (
    <>
      <Breadcrumb pageName="Galerie" />

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-black dark:text-white">
              Galerie d'images
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {filteredImages.length} image{filteredImages.length > 1 ? 's' : ''} dans la catégorie {selectedTab}
            </p>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-sm font-medium text-white hover:bg-opacity-90"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Ajouter une image
          </button>
        </div>

        <div className="mb-6 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-wrap gap-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedTab(category)}
                className={`inline-flex items-center justify-center rounded-t-md px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  selectedTab === category
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Aucune image dans cette catégorie
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
            {filteredImages.map((image) => (
              <div
                key={image._id}
                className="group relative overflow-hidden rounded-sm"
              >
                <img
                  src={`http://localhost:5000/${image.imageUrl}`}
                  alt={`${image.category}`}
                  className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-300 group-hover:bg-opacity-50">
                  <button
                    onClick={() => handleDelete(image._id)}
                    className="absolute top-4 right-4 rounded-full bg-red-500 p-2 text-white opacity-0 transition-opacity duration-300 hover:bg-red-600 group-hover:opacity-100"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'upload */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-md rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black dark:text-white">
                Ajouter une image
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-600 hover:text-primary dark:text-gray-400"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-5">
              <label className="mb-2.5 block text-black dark:text-white">
                Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="mb-2.5 block text-black dark:text-white">
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg border border-stroke py-2 px-6 text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="inline-flex items-center justify-center rounded-lg bg-primary py-2 px-6 text-sm font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
                ) : (
                  'Télécharger'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery; 