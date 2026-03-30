'use client';

import { useState, useEffect } from 'react';

const EventDetailsForm = ({ formData, setFormData, previews, setPreviews }) => {
  useEffect(() => {
    // Initialize eventDetails if it doesn't exist
    if (!formData.eventDetails) {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
          section1: {},
          section2: {}
        }
      }));
    }
  }, []);

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
          ...prev.eventDetails,
          eventVideo: file
        }
      }));
      setPreviews(prev => ({
        ...prev,
        video: URL.createObjectURL(file)
      }));
    }
  };

  const handleImageChange = (section, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
          ...prev.eventDetails,
          [section]: {
            ...(prev.eventDetails?.[section] || {}),
            [`image${section === 'section1' ? '1' : '2'}`]: file
          }
        }
      }));
      setPreviews(prev => ({
        ...prev,
        [section]: URL.createObjectURL(file)
      }));
    }
  };

  const handleDetailsChange = (e, section, field) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      eventDetails: {
        ...prev.eventDetails,
        [section]: {
          ...(prev.eventDetails?.[section] || {}),
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="event-details-form">
      {/* Video Upload Section */}
      <div className="mb-4">
        <h6 className="form-label d-flex align-items-center mb-3">
          <i className="ph ph-video me-2 text-main-600"></i>
          Event Video
        </h6>
        <div className="upload-container position-relative">
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="form-control bg-white border-2 border-neutral-30 rounded-16 py-2 px-3"
          />
          {previews.video && (
            <div className="mt-3 preview-container rounded-16 overflow-hidden bg-white p-3 border border-2">
              <video
                controls
                className="w-100 rounded-12"
                style={{ maxHeight: '200px' }}
              >
                <source src={previews.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      </div>

      {/* Section 1 */}
      <div className="mb-4">
        <div className="section-header d-flex align-items-center mb-3">
          <i className="ph ph-number-circle-one me-2 text-main-600"></i>
          <h6 className="mb-0">Section 1</h6>
        </div>
        <div className="upload-container mb-3">
          <label className="form-label small text-muted d-flex align-items-center">
            <i className="ph ph-image me-2"></i>
            Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange('section1', e)}
            className="form-control bg-white border-2 border-neutral-30 rounded-16 py-2 px-3"
          />
          {previews.section1 && (
            <div className="mt-2 preview-container rounded-16 overflow-hidden bg-white p-2 border border-2">
              <img
                src={previews.section1}
                alt="Section 1 preview"
                className="w-100 rounded-12"
                style={{ maxHeight: '150px', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label small text-muted d-flex align-items-center">
            <i className="ph ph-text-t me-2"></i>
            Title
          </label>
          <input
            type="text"
            value={formData.eventDetails?.section1?.title1 || ''}
            onChange={(e) => handleDetailsChange(e, 'section1', 'title1')}
            className="form-control bg-white border-2 border-neutral-30 rounded-16 py-2 px-3"
            placeholder="Enter section title"
          />
        </div>
        <div className="mb-3">
          <label className="form-label small text-muted d-flex align-items-center">
            <i className="ph ph-text-align-left me-2"></i>
            Content
          </label>
          <textarea
            value={formData.eventDetails?.section1?.paragraph1 || ''}
            onChange={(e) => handleDetailsChange(e, 'section1', 'paragraph1')}
            className="form-control bg-white border-2 border-neutral-30 rounded-16 py-2 px-3"
            rows="3"
            placeholder="Enter section content"
          />
        </div>
      </div>

      {/* Section 2 */}
      <div className="mb-4">
        <div className="section-header d-flex align-items-center mb-3">
          <i className="ph ph-number-circle-two me-2 text-main-600"></i>
          <h6 className="mb-0">Section 2</h6>
        </div>
        <div className="upload-container mb-3">
          <label className="form-label small text-muted d-flex align-items-center">
            <i className="ph ph-image me-2"></i>
            Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange('section2', e)}
            className="form-control bg-white border-2 border-neutral-30 rounded-16 py-2 px-3"
          />
          {previews.section2 && (
            <div className="mt-2 preview-container rounded-16 overflow-hidden bg-white p-2 border border-2">
              <img
                src={previews.section2}
                alt="Section 2 preview"
                className="w-100 rounded-12"
                style={{ maxHeight: '150px', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label small text-muted d-flex align-items-center">
            <i className="ph ph-text-t me-2"></i>
            Title
          </label>
          <input
            type="text"
            value={formData.eventDetails?.section2?.title2 || ''}
            onChange={(e) => handleDetailsChange(e, 'section2', 'title2')}
            className="form-control bg-white border-2 border-neutral-30 rounded-16 py-2 px-3"
            placeholder="Enter section title"
          />
        </div>
        <div className="mb-3">
          <label className="form-label small text-muted d-flex align-items-center">
            <i className="ph ph-text-align-left me-2"></i>
            Content
          </label>
          <textarea
            value={formData.eventDetails?.section2?.paragraph2 || ''}
            onChange={(e) => handleDetailsChange(e, 'section2', 'paragraph2')}
            className="form-control bg-white border-2 border-neutral-30 rounded-16 py-2 px-3"
            rows="3"
            placeholder="Enter section content"
          />
        </div>
      </div>

      <style jsx>{`
        .event-details-form {
          font-size: 0.95rem;
        }

        .form-control {
          transition: all 0.3s ease;
        }

        .form-control:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
        }

        .preview-container {
          border-color: #dee2e6;
        }

        .text-main-600 {
          color: #0d6efd;
        }

        .rounded-16 {
          border-radius: 16px;
        }

        .rounded-12 {
          border-radius: 12px;
        }

        .border-2 {
          border-width: 2px !important;
        }

        .section-header {
          position: relative;
        }

        .section-header::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 40px;
          height: 2px;
          background-color: #0d6efd;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default EventDetailsForm; 