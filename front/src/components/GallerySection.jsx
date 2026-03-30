"use client";
import LightGallery from "lightgallery/react";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import lgZoom from "lightgallery/plugins/zoom";
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

const GallerySection = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pills-langues');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/gallery`);
      setImages(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load gallery images');
    } finally {
      setLoading(false);
    }
  };

  const getImagesByCategory = (category) => {
    switch (category) {
      case 'pills-langues':
        return images.filter(img => img.category === 'Langues');
      case 'pills-informatique':
        return images.filter(img => img.category === 'Informatique');
      case 'pills-concours':
        return images.filter(img => img.category === 'Concours');
      default:
        return [];
    }
  };

  return (
    <section className='gallery py-120'>
      <div className='container'>
        <div className='container'>
          <div className='section-heading text-center'>
            <div className='flex-align d-inline-flex gap-8 mb-16'>
              <span className='text-main-600 text-2xl d-flex'>
                <i className='ph-bold ph-book-open' />
              </span>
              <h5 className='text-main-600 mb-0'>Gallery</h5>
            </div>
            <h2 className='mb-24'>Explore Our Gallery</h2>
            <p className=''>
              Students can register for the workshops through the Smartech
              platform. Limited seats are available
            </p>
          </div>
          <div className='text-center'>
            <div
              className='nav-tab-wrapper bg-white border border-neutral-40 p-16 mb-40 d-inline-block'
              data-aos='zoom-out'
            >
              <ul
                className='nav nav-pills common-tab gap-16'
                id='pills-tab'
                role='tablist'
              >
                <li className='nav-item' role='presentation'>
                  <button
                    className={`nav-link rounded-pill bg-main-25 text-md fw-medium text-neutral-500 flex-center w-100 gap-8 ${activeTab === 'pills-langues' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pills-langues')}
                    id='pills-langues-tab'
                    data-bs-toggle='pill'
                    data-bs-target='#pills-langues'
                    type='button'
                    role='tab'
                    aria-controls='pills-langues'
                    aria-selected={activeTab === 'pills-langues'}
                  >
                    <i className='text-xl d-flex text-main-600 ph-bold ph-squares-four' />
                    Languages
                  </button>
                </li>
                <li className='nav-item' role='presentation'>
                  <button
                    className={`nav-link rounded-pill bg-main-25 text-md fw-medium text-neutral-500 flex-center w-100 gap-8 ${activeTab === 'pills-informatique' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pills-informatique')}
                    id='pills-informatique-tab'
                    data-bs-toggle='pill'
                    data-bs-target='#pills-informatique'
                    type='button'
                    role='tab'
                    aria-controls='pills-informatique'
                    aria-selected={activeTab === 'pills-informatique'}
                  >
                    <i className='text-xl d-flex text-main-600 ph-bold ph-magic-wand' />
                    Computer Science
                  </button>
                </li>
                <li className='nav-item' role='presentation'>
                  <button
                    className={`nav-link rounded-pill bg-main-25 text-md fw-medium text-neutral-500 flex-center w-100 gap-8 ${activeTab === 'pills-concours' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pills-concours')}
                    id='pills-concours-tab'
                    data-bs-toggle='pill'
                    data-bs-target='#pills-concours'
                    type='button'
                    role='tab'
                    aria-controls='pills-concours'
                    aria-selected={activeTab === 'pills-concours'}
                  >
                    <i className='text-xl d-flex text-main-600 ph-bold ph-code' />
                    Competitions
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className='tab-content' id='pills-tabContent'>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                {error}
              </div>
            ) : (
              <>
                <div
                  className={`tab-pane fade ${activeTab === 'pills-langues' ? 'show active' : ''}`}
                  id='pills-langues'
                  role='tabpanel'
                  aria-labelledby='pills-langues-tab'
                  tabIndex={0}
                >
                  <div className='masonry'>
                    <LightGallery speed={500} plugins={[lgThumbnail, lgZoom]}>
                      {getImagesByCategory('pills-langues').map((image) => (
                        <a
                          key={image._id}
                          className='masonry__item position-relative rounded-12 overflow-hidden'
                          href={`${API_URL}/${image.imageUrl}`}
                        >
                          <img
                            alt={image.category}
                            src={`${API_URL}/${image.imageUrl}`}
                          />
                        </a>
                      ))}
                    </LightGallery>
                  </div>
                </div>
                <div
                  className={`tab-pane fade ${activeTab === 'pills-informatique' ? 'show active' : ''}`}
                  id='pills-informatique'
                  role='tabpanel'
                  aria-labelledby='pills-informatique-tab'
                  tabIndex={0}
                >
                  <div className='masonry'>
                    <LightGallery speed={500} plugins={[lgThumbnail, lgZoom]}>
                      {getImagesByCategory('pills-informatique').map((image) => (
                        <a
                          key={image._id}
                          className='masonry__item position-relative rounded-12 overflow-hidden'
                          href={`${API_URL}/${image.imageUrl}`}
                        >
                          <img
                            alt={image.category}
                            src={`${API_URL}/${image.imageUrl}`}
                          />
                        </a>
                      ))}
                    </LightGallery>
                  </div>
                </div>
                <div
                  className={`tab-pane fade ${activeTab === 'pills-concours' ? 'show active' : ''}`}
                  id='pills-concours'
                  role='tabpanel'
                  aria-labelledby='pills-concours-tab'
                  tabIndex={0}
                >
                  <div className='masonry'>
                    <LightGallery speed={500} plugins={[lgThumbnail, lgZoom]}>
                      {getImagesByCategory('pills-concours').map((image) => (
                        <a
                          key={image._id}
                          className='masonry__item position-relative rounded-12 overflow-hidden'
                          href={`${API_URL}/${image.imageUrl}`}
                        >
                          <img
                            alt={image.category}
                            src={`${API_URL}/${image.imageUrl}`}
                          />
                        </a>
                      ))}
                    </LightGallery>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
