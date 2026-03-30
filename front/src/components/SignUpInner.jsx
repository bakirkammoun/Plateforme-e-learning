"use client";
import { useState, useEffect } from "react";
import axios from "axios";

const SignUpInner = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [role, setRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [interests, setInterests] = useState([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [cvFileName, setCvFileName] = useState('');

  const sectors = {
    languages: {
      name: "Languages",
      options: ["Français", "Anglais", "Espagnol", "Allemand", "Italien"]
    },
    computerScience: {
      name: "Computer Science",
      options: [
        "IT Development",
        "Artificial Intelligence and Big Data",
        "Graphics and Digital Marketing",
        "Office automation"
      ]
    },
    competitions: {
      name: "Competitions and School Training",
      options: [
        "Preparation for Competitions",
        "Training for All Levels"
      ]
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSectorChange = (sectorKey) => {
    if (role === 'instructor') {
      setSelectedSector(selectedSector === sectorKey ? '' : sectorKey);
      setSpecialization('');
    } else {
      setSelectedSector(sectorKey);
    }
  };

  const handleSpecializationChange = (e) => {
    setSpecialization(e.target.value);
  };

  const handleInterestChange = (value) => {
    if (interests.includes(value)) {
      setInterests(interests.filter(i => i !== value));
    } else {
      setInterests([...interests, value]);
    }
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCvFile(file);
      setCvFileName(file.name);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
      setError("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/categories/${categoryId}/subcategories`);
      setSubcategories(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des sous-catégories:", error);
      setError("Erreur lors du chargement des sous-catégories");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    const subs = categories.filter(cat => cat.parentCategory === category._id);
    setSubcategories(subs);
    setSelectedSector(category._id);
    setSpecialization('');
    setInterests([]);
  };

  // 👉 Signup Request
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Validation pour les instructeurs
      if (role === 'instructor') {
        if (!selectedSector) {
          setError("Please select a sector");
          return;
        }
        if (!specialization) {
          setError("Please select a specialization");
          return;
        }
        if (!cvFile) {
          setError("Please upload your CV");
          return;
        }
      }

      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', role);
      if (role === 'instructor') {
        formData.append('specialization', specialization);
        formData.append('sector', selectedSector);
        formData.append('cv', cvFile);
      } else {
        formData.append('interests', JSON.stringify(interests));
      }

      const response = await axios.post("http://localhost:5000/api/auth/signup", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setOtpSent(true);
      setSuccess(response.data.message || "OTP sent to your email.");
      setError("");
    } catch (err) {
      setError(err.response ? err.response.data.message : "An error occurred");
      setSuccess("");
    }
  };

  // 👉 Verify OTP Request
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp,
      });

      setSuccess(response.data.message || "OTP Verified! You can now log in.");
      setError("");
      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 2000);
    } catch (err) {
      setError(err.response ? err.response.data.message : "Invalid OTP");
    }
  };

  return (
    <div className="account py-120 position-relative">
      <div className="container">
        <div className="row gy-4 align-items-center">
          <div className="col-lg-6 d-flex justify-content-center">
            <div className="bg-main-25 border border-neutral-30 rounded-8 p-32 w-100">
              <div className="mb-40">
                <h3 className="mb-16 text-neutral-500">Let's Get Started!</h3>
                <p className="text-neutral-500">
                  {otpSent 
                    ? "Please enter the verification code sent to your email"
                    : "Please Enter your Email Address to Start your Online Application"
                  }
                </p>
              </div>

              {otpSent ? (
                <form onSubmit={handleVerifyOtp}>
                  <div className="row gy-4">
                    <div className="col-sm-12">
                      <label className="fw-medium text-lg text-neutral-500 mb-16">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        className="common-input rounded-pill"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP sent to your email..."
                        required
                      />
                    </div>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {success && <p style={{ color: "green" }}>{success}</p>}
                    <div className="col-sm-12">
                      <button type="submit" className="btn btn-main rounded-pill w-100">
                        Verify OTP
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup}>
                  <div className="row gy-4">
                    <div className="col-sm-6">
                      <label htmlFor="fname" className="fw-medium text-lg text-neutral-500 mb-16">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="common-input rounded-pill"
                        id="fname"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter Your First Name"
                        required
                      />
                    </div>
                    <div className="col-sm-6">
                      <label htmlFor="lname" className="fw-medium text-lg text-neutral-500 mb-16">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="common-input rounded-pill"
                        id="lname"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter Your Last Name"
                        required
                      />
                    </div>
                    <div className="col-sm-12">
                      <label htmlFor="email" className="fw-medium text-lg text-neutral-500 mb-16">
                        Enter Your Email ID
                      </label>
                      <input
                        type="email"
                        className="common-input rounded-pill"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        required
                      />
                    </div>
                    <div className="col-sm-12">
                      <label htmlFor="password" className="fw-medium text-lg text-neutral-500 mb-16">
                        Password
                      </label>
                      <div className="position-relative">
                        <input
                          type={passwordVisible ? "text" : "password"}
                          className="common-input rounded-pill"
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter Your Password..."
                          required
                        />
                        <span
                          className={`toggle-password position-absolute top-50 end-0 me-16 translate-middle-y ph-bold ${
                            passwordVisible ? "ph-eye" : "ph-eye-closed"
                          }`}
                          onClick={togglePasswordVisibility}
                        ></span>
                      </div>
                    </div>

                    <div className="col-sm-12">
                      <label className="fw-medium text-lg text-neutral-500 mb-16">
                        Select Your Role
                      </label>
                      <select
                        className="common-input rounded-pill"
                        value={role}
                        onChange={(e) => {
                          setRole(e.target.value);
                          setSpecialization('');
                          setInterests([]);
                          setSelectedSector('');
                        }}
                        required
                      >
                        <option value="">Choose a Role</option>
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                      </select>
                    </div>

                    {role && (
                      <>
                        <div className="col-sm-12 mb-4">
                          <label className="fw-medium text-lg text-neutral-500 mb-16">
                            {role === 'instructor' ? 'Select One Sector' : 'Select Your Sectors'}
                          </label>
                          <div className="options-container">
                            <div className="d-flex flex-wrap gap-3">
                              {categories
                                .filter(cat => !cat.parentCategory)
                                .map((category) => (
                                  <div
                                    key={category._id}
                                    className={`option-button ${selectedCategory?._id === category._id ? 'active' : ''}`}
                                    onClick={() => handleCategorySelect(category)}
                                  >
                                    <i className={`ph-bold ${
                                      category.name.toLowerCase().includes('langue') ? 'ph-translate' :
                                      category.name.toLowerCase().includes('informatique') ? 'ph-desktop' :
                                      'ph-graduation-cap'
                                    }`}></i>
                                    <span className="text">{category.name}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        {selectedCategory && (
                          <div className="col-sm-12">
                            {role === 'instructor' ? (
                              <div className="specialization-container">
                                <label className="fw-medium text-lg text-neutral-500 mb-16">
                                  Select One Specialization
                                </label>
                                <select
                                  className="common-input rounded-pill w-100"
                                  value={specialization}
                                  onChange={handleSpecializationChange}
                                  required
                                >
                                  <option value="">Choose a Specialization</option>
                                  {subcategories.map((subcategory) => (
                                    <option key={subcategory._id} value={subcategory._id}>
                                      {subcategory.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="accordion common-accordion" id="interestsAccordion">
                                <div className="accordion-item">
                                  <h2 className="accordion-header">
                                    <button
                                      className="accordion-button"
                                      type="button"
                                      data-bs-toggle="collapse"
                                      data-bs-target="#interestsCollapse"
                                      aria-expanded="true"
                                    >
                                      Select Your Interests
                                    </button>
                                  </h2>
                                  <div
                                    id="interestsCollapse"
                                    className="accordion-collapse collapse show"
                                  >
                                    <div className="accordion-body">
                                      <div className="interests-list">
                                        {subcategories.map((subcategory) => (
                                          <div key={subcategory._id} className="interest-item">
                                            <label className="custom-checkbox">
                                              <input
                                                type="checkbox"
                                                checked={interests.includes(subcategory._id)}
                                                onChange={() => handleInterestChange(subcategory._id)}
                                              />
                                              <span className="checkmark"></span>
                                              <span className="label-text">{subcategory.name}</span>
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {role === 'instructor' && (
                          <div className="col-sm-12 mb-4">
                            <label className="fw-medium text-lg text-neutral-500 mb-16">
                              Upload Your CV
                            </label>
                            <div className="cv-upload-container">
                              <input
                                type="file"
                                id="cv-upload"
                                accept=".pdf,.doc,.docx"
                                onChange={handleCvChange}
                                className="d-none"
                              />
                              <label
                                htmlFor="cv-upload"
                                className="cv-upload-button d-flex align-items-center justify-content-center gap-2"
                              >
                                <i className="ph-bold ph-file-text"></i>
                                <span>{cvFileName || 'Choose your CV'}</span>
                              </label>
                              {cvFileName && (
                                <div className="cv-preview mt-2">
                                  <span className="text-sm text-neutral-500">
                                    Selected file: {cvFileName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {success && <p style={{ color: "green" }}>{success}</p>}
                    
                    <div className="col-sm-12">
                      <p className="text-neutral-500 mt-8">
                        Have an account?{" "}
                        <a href="sign-in" className="fw-semibold text-main-600 hover-text-decoration-underline">
                          Sign In
                        </a>
                      </p>
                    </div>
                    
                    <div className="col-sm-12">
                      <button type="submit" className="btn btn-main rounded-pill">
                        Sign Up
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="col-lg-6 d-flex justify-content-end">
            <div className="account-img">
              <img
                src="assets/images/thumbs/account-img.png"
                alt="Signup Illustration"
                className="img-fluid"
              />
            </div>
          </div>
          
        </div>
      </div>

      <style jsx>{`
        .common-accordion {
          border: 1px solid rgba(231, 234, 243, 0.7);
          border-radius: 12px;
          overflow: hidden;
        }

        .accordion-item {
          border: none;
          background: white;
        }

        .accordion-button {
          padding: 20px 24px;
          font-weight: 500;
          font-size: 16px;
          color: #1A1A1A;
          background: white;
        }

        .accordion-button:not(.collapsed) {
          color: white;
          background-color: var(--main-600);
        }

        .accordion-button:focus {
          box-shadow: none;
          border-color: rgba(231, 234, 243, 0.7);
        }

        .accordion-body {
          padding: 0 24px 20px;
        }

        .interests-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .interest-item {
          padding: 8px 0;
        }

        .custom-checkbox {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          gap: 12px;
        }

        .custom-checkbox input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        .checkmark {
          position: relative;
          height: 20px;
          width: 20px;
          background-color: #fff;
          border: 2px solid #E7EAF3;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .custom-checkbox input:checked ~ .checkmark {
          background-color: var(--main-600);
          border-color: var(--main-600);
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
          left: 6px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .custom-checkbox input:checked ~ .checkmark:after {
          display: block;
        }

        .label-text {
          color: #4B5563;
          font-size: 14px;
        }

        .custom-checkbox:hover .checkmark {
          border-color: var(--main-600);
        }

        .options-container {
          width: 100%;
        }

        .option-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background-color: #F8FAFC;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          color: #64748B;
          border: 1px solid #E2E8F0;
          min-width: 200px;
          justify-content: center;
        }

        .option-button:hover {
          background-color: #EEF2FF;
          color: #3B82F6;
          border-color: #3B82F6;
        }

        .option-button.active {
          background-color: #0066FF;
          color: white;
          border-color: #0066FF;
        }

        .option-button i {
          font-size: 1.2em;
        }

        .option-button .text {
          font-size: 16px;
        }

        .options-container {
          margin-bottom: 1.5rem;
        }

        .options-container .d-flex {
          justify-content: center;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .option-button {
            width: 100%;
            justify-content: center;
          }
        }

        .custom-checkbox input:checked ~ .label-text {
          color: var(--main-600);
        }

        .accordion-button.active {
          color: white;
          background-color: var(--main-600);
        }

        .accordion-body {
          padding: 0 24px 20px;
        }

        .interests-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .interest-item {
          padding: 8px 0;
        }

        .custom-checkbox {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          gap: 12px;
        }

        .custom-checkbox input:checked ~ .checkmark {
          background-color: var(--main-600);
          border-color: var(--main-600);
        }

        .custom-checkbox input:checked ~ .label-text {
          color: white;
        }

        .option-button.active .text,
        .option-button.active i {
          color: white;
        }

        select option:checked {
          background-color: var(--main-600);
          color: white;
        }

        select option:hover {
          background-color: var(--main-600);
          color: white;
        }

        .accordion-collapse.show .accordion-body {
          background-color: var(--main-600);
          color: white;
        }

        .accordion-collapse.show .custom-checkbox .label-text {
          color: white;
        }

        .accordion-collapse.show select {
          background-color: white;
          color: #4B5563;
        }

        .accordion-collapse.show select option {
          background-color: white;
          color: #4B5563;
        }

        .accordion-collapse.show select option:checked {
          background-color: var(--main-600);
          color: white;
        }

        .btn-main {
          transition: all 0.3s ease;
        }

        .btn-main:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.15);
        }

        .common-input {
          transition: all 0.3s ease;
        }

        .common-input:focus {
          border-color: var(--main-600);
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }

        .cv-upload-container {
          position: relative;
        }

        .cv-upload-button {
          background-color: #F8FAFC;
          border: 2px dashed #E2E8F0;
          border-radius: 50px;
          padding: 12px 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #64748B;
          font-weight: 500;
        }

        .cv-upload-button:hover {
          background-color: #EEF2FF;
          border-color: #3B82F6;
          color: #3B82F6;
        }

        .cv-upload-button i {
          font-size: 1.2em;
        }

        .cv-preview {
          padding: 8px 16px;
          background-color: #F8FAFC;
          border-radius: 8px;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
};

export default SignUpInner;