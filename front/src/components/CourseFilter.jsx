'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactSlider from 'react-slider';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const CourseFilter = ({ onFilter, categories = [], levels = [], sidebarControl, initialCategory = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);

  const languageLevels = [
    'Débutant',
    'Elémentaire',
    'Intermédiaire',
    'Avancé',
    'Autonome',
    'Maîtrise'
  ];

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategories([initialCategory]);
      handleFilter({
        searchTerm: '',
        categories: [initialCategory],
        levels: [],
        priceRange: [0, 1000]
      });
    }
  }, [initialCategory]);

  useEffect(() => {
    // Mettre à jour les niveaux disponibles en fonction de la catégorie sélectionnée
    if (selectedCategories.includes('Langues')) {
      setSelectedLevels(languageLevels);
    } else if (selectedCategories.length === 0) {
      setSelectedLevels(levels); // Revenir aux niveaux par défaut si aucune catégorie n'est sélectionnée
    } else {
      setSelectedLevels(levels.filter(level => !languageLevels.includes(level))); // Filtrer les niveaux de langue si une autre catégorie est sélectionnée
    }
  }, [selectedCategories, levels]);

  const handleFilter = (filters) => {
    onFilter(filters);
  };

  const handleCategoryChange = (category) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [category]; // Ne permettre qu'une seule catégorie à la fois
    setSelectedCategories(newCategories);
    handleFilter({
      searchTerm,
      categories: newCategories,
      levels: selectedLevels,
      priceRange
    });
  };

  const handleLevelChange = (level) => {
    const newLevels = selectedLevels.includes(level)
      ? selectedLevels.filter((l) => l !== level)
      : [...selectedLevels, level];
    setSelectedLevels(newLevels);
    handleFilter({
      searchTerm,
      categories: selectedCategories,
      levels: newLevels,
      priceRange
    });
  };

  const handlePriceChange = (value) => {
    setPriceRange(value);
    handleFilter({
      searchTerm,
      categories: selectedCategories,
      levels: selectedLevels,
      priceRange: value
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleFilter({
      searchTerm: value,
      categories: selectedCategories,
      levels: selectedLevels,
      priceRange
    });
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedLevels([]);
    setPriceRange([0, 1000]);
    handleFilter({
      searchTerm: '',
      categories: [],
      levels: [],
      priceRange: [0, 1000]
    });
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className='flex-between mb-24'>
        <h4 className='mb-0'>Filter</h4>
        <button
          type='button'
          onClick={sidebarControl}
          className='sidebar-close text-xl text-neutral-500 d-lg-none hover-text-main-600'
        >
          <i className='ph-bold ph-x' />
        </button>
      </div>
      <div className='position-relative'>
        <input
          type='text'
          className='common-input pe-48 rounded-pill'
          placeholder='Search for courses...'
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <button
          type='button'
          className='text-neutral-500 text-xl d-flex position-absolute top-50 translate-middle-y inset-inline-end-0 me-24 hover-text-main-600'
        >
          <i className='ph-bold ph-magnifying-glass' />
        </button>
      </div>
      <span className='d-block border border-neutral-30 border-dashed my-24' />
      <h6 className='text-lg mb-24 fw-medium'>Course Categories</h6>
      <div className='d-flex flex-column gap-16'>
        {categories.map(category => (
          <div key={category} className='flex-between gap-16'>
            <div className='form-check common-check mb-0'>
              <input
                className='form-check-input'
                type='checkbox'
                name='categories'
                id={category}
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryChange(category)}
              />
              <label
                className='form-check-label fw-normal flex-grow-1'
                htmlFor={category}
              >
                {category}
              </label>
            </div>
          </div>
        ))}
      </div>
      <span className='d-block border border-neutral-30 border-dashed my-24' />
      <div>
        <h6 className='text-lg mb-20 fw-medium'>Price Range</h6>
        <div className='custom--range'>
          <Slider
            range
            min={0}
            max={1000}
            value={priceRange}
            onChange={handlePriceChange}
          />
          <div className='custom--range__content'>
            <input
              type='text'
              id='amount'
              readOnly
              className='custom--range__prices text-neutral-600 text-start text-md fw-medium w-100 text-center bg-transparent border-0 outline-0'
              value={`${priceRange[0]} DT - ${priceRange[1]} DT`}
            />
          </div>
        </div>
      </div>
      <span className='d-block border border-neutral-30 border-dashed my-24' />
      <h6 className='text-lg mb-24 fw-medium'>Level</h6>
      <div className='d-flex flex-column gap-16'>
        {levels.map((level) => (
          <div key={level} className='form-check common-check mb-0'>
            <input
              className='form-check-input'
              type='checkbox'
              name='levels'
              id={level}
              checked={selectedLevels.includes(level)}
              onChange={() => handleLevelChange(level)}
            />
            <label
              className='form-check-label fw-normal flex-grow-1'
              htmlFor={level}
            >
              {level}
            </label>
          </div>
        ))}
      </div>
      <span className='d-block border border-neutral-30 border-dashed my-24' />
      <button
        type='button'
        onClick={handleReset}
        className='btn btn-outline-main rounded-pill flex-center gap-16 fw-semibold w-100'
      >
        <i className='ph-bold ph-arrow-clockwise d-flex text-lg' />
        Reset Filters
      </button>

      <style jsx>{`
        .custom--range {
          padding: 20px;
        }
        
        .horizontal-slider {
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
        }
        
        .thumb {
          width: 16px;
          height: 16px;
          background: #2563eb;
          border-radius: 50%;
          cursor: pointer;
          outline: none;
          top: -6px;
          transition: all 0.2s ease;
        }
        
        .thumb:hover {
          transform: scale(1.2);
        }
        
        .track {
          height: 4px;
          background: #2563eb;
        }
        
        .track.track-1 {
          background: #2563eb;
        }
        
        .custom--range__content {
          margin-top: 20px;
          text-align: center;
        }
      `}</style>
    </form>
  );
};

export default CourseFilter; 