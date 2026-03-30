'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Breadcrumb from "@/components/Breadcrumb";
import HeaderInstructor from "@/components/Header";
import FooterOne from "@/components/FooterOne";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditCourse = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    price: '',
    duration: '',
    image: '',
    status: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Get the course ID from the URL
        const pathParts = window.location.pathname.split('/');
        const courseId = pathParts[pathParts.length - 1];

        const response = await axios.get(`http://localhost:5000/api/formations/${courseId}`);
        const course = response.data;

        setFormData({
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          price: course.price.toString(),
          duration: course.duration.toString(),
          image: course.image,
          status: course.status
        });
        setImagePreview(course.image);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Erreur lors du chargement du cours');
        setLoading(false);
      }
    };

    fetchCourse();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return formData.image;

    const formDataImg = new FormData();
    formDataImg.append('image', selectedImage);

    try {
      const response = await axios.post('http://localhost:5000/api/upload/image', formDataImg);
      return response.data.url;
    } catch (error) {
      throw new Error('Erreur lors de l\'upload de l\'image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image;
      if (selectedImage) {
        imageUrl = await handleImageUpload();
      }

      const pathParts = window.location.pathname.split('/');
      const courseId = pathParts[pathParts.length - 1];

      const updatedFormData = {
        ...formData,
        image: imageUrl,
        price: Number(formData.price),
        duration: Number(formData.duration)
      };

      await axios.put(`http://localhost:5000/api/formations/${courseId}`, updatedFormData);
      toast.success('Cours mis à jour avec succès');
      router.push('/my-courses');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Erreur lors de la mise à jour du cours');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <HeaderInstructor />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-main-600"></div>
        </div>
        <FooterOne />
      </>
    );
  }

  return (
    <>
      <HeaderInstructor />
      <Breadcrumb title="Edit Course" />
      <ToastContainer />

      <section className="course-form py-80">
        <div className="container">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="common-input rounded-pill bg-main-25 border-neutral-30 w-100"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="common-input rounded-12 bg-main-25 border-neutral-30 w-100"
                rows="4"
                required
              />
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-select common-input rounded-pill bg-main-25 border-neutral-30 w-100"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Développement Web">Web Development</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Business">Business</option>
                  <option value="Autre">Other</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="form-select common-input rounded-pill bg-main-25 border-neutral-30 w-100"
                  required
                >
                  <option value="">Select Level</option>
                  <option value="Débutant">Beginner</option>
                  <option value="Intermédiaire">Intermediate</option>
                  <option value="Avancé">Advanced</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="common-input rounded-pill bg-main-25 border-neutral-30 w-100"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="common-input rounded-pill bg-main-25 border-neutral-30 w-100"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select common-input rounded-pill bg-main-25 border-neutral-30 w-100"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="col-12">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Course Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="common-input rounded-pill bg-main-25 border-neutral-30 w-100"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Course preview"
                      className="max-w-xs rounded-lg shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/my-courses')}
                className="btn btn-outline-primary rounded-pill"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-pill"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Course'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <FooterOne />

      <style jsx>{`
        .course-form {
          background-color: #fff;
        }
        
        .common-input,
        .form-select {
          padding: 0.75rem 1.25rem;
          font-size: 1rem;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }
        
        .common-input:focus,
        .form-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
        
        .btn {
          padding: 0.75rem 2rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .btn-primary {
          background-color: #2563eb;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #1d4ed8;
        }
        
        .btn-outline-primary {
          border: 1px solid #2563eb;
          color: #2563eb;
        }
        
        .btn-outline-primary:hover {
          background-color: #2563eb;
          color: white;
        }
        
        .rounded-pill {
          border-radius: 50rem;
        }
        
        .rounded-12 {
          border-radius: 12px;
        }
      `}</style>
    </>
  );
};

export default EditCourse; 