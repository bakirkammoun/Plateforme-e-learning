"use client";
import React, { useState } from "react";
import axios from "axios";
import { toast } from 'react-hot-toast';

const ForgotPasswordInner = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email }
      );

      setSuccess("A verification code has been sent to your email");
      setStep(2);
      toast.success("Verification code sent!");
    } catch (error) {
      setError(error.response?.data?.message || "An error occurred");
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/verify-reset-otp",
        { email, otp }
      );

      setSuccess("Code verified successfully");
      setStep(3);
      toast.success("Code verified successfully!");
    } catch (error) {
      setError(error.response?.data?.message || "Invalid code");
      toast.error(error.response?.data?.message || "Invalid code");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        { 
          email,
          otp,
          newPassword 
        }
      );

      setSuccess("Password reset successfully");
      toast.success("Password reset successfully!");
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || "An error occurred");
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="account py-120 position-relative">
      <div className="container">
        <div className="row gy-4 align-items-center">
          <div className="col-lg-6">
            <div className="bg-main-25 border border-neutral-30 rounded-8 p-32">
              <div className="mb-40">
                <h3 className="mb-16 text-neutral-500">Password Reset</h3>
                <p className="text-neutral-500">
                  {step === 1 && "Enter your email to receive a verification code"}
                  {step === 2 && "Enter the verification code received by email"}
                  {step === 3 && "Enter your new password"}
                </p>
              </div>

              {step === 1 && (
                <form onSubmit={handleSendOTP}>
                  <div className="mb-24">
                    <label
                      htmlFor="email"
                      className="fw-medium text-lg text-neutral-500 mb-16"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      className="common-input rounded-pill"
                      id="email"
                      placeholder="Enter your email..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="mb-16 text-danger">
                      <p>{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="mb-16 text-success">
                      <p>{success}</p>
                    </div>
                  )}

                  <div className="mt-40">
                    <button
                      type="submit"
                      className="btn btn-main rounded-pill flex-center gap-8 mt-40"
                    >
                      Send Code
                      <i className="ph-bold ph-arrow-up-right d-flex text-lg" />
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleVerifyOTP}>
                  <div className="mb-24">
                    <label
                      htmlFor="otp"
                      className="fw-medium text-lg text-neutral-500 mb-16"
                    >
                      Verification Code
                    </label>
                    <input
                      type="text"
                      className="common-input rounded-pill"
                      id="otp"
                      placeholder="Enter the code..."
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="mb-16 text-danger">
                      <p>{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="mb-16 text-success">
                      <p>{success}</p>
                    </div>
                  )}

                  <div className="mt-40">
                    <button
                      type="submit"
                      className="btn btn-main rounded-pill flex-center gap-8 mt-40"
                    >
                      Verify Code
                      <i className="ph-bold ph-arrow-up-right d-flex text-lg" />
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handleResetPassword}>
                  <div className="mb-24">
                    <label
                      htmlFor="newPassword"
                      className="fw-medium text-lg text-neutral-500 mb-16"
                    >
                      New Password
                    </label>
                    <div className="position-relative">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        className="common-input rounded-pill pe-44"
                        id="newPassword"
                        placeholder="Enter your new password..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <span
                        className={`toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y ph-bold ${
                          passwordVisible ? "ph-eye" : "ph-eye-closed"
                        }`}
                        onClick={togglePasswordVisibility}
                      ></span>
                    </div>
                  </div>

                  <div className="mb-24">
                    <label
                      htmlFor="confirmPassword"
                      className="fw-medium text-lg text-neutral-500 mb-16"
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      className="common-input rounded-pill"
                      id="confirmPassword"
                      placeholder="Confirm your new password..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="mb-16 text-danger">
                      <p>{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="mb-16 text-success">
                      <p>{success}</p>
                    </div>
                  )}

                  <div className="mt-40">
                    <button
                      type="submit"
                      className="btn btn-main rounded-pill flex-center gap-8 mt-40"
                    >
                      Reset Password
                      <i className="ph-bold ph-arrow-up-right d-flex text-lg" />
                    </button>
                  </div>
                </form>
              )}

              <div className="mb-16 text-end">
                <a
                  href="/sign-in"
                  className="text-warning-600 hover-text-decoration-underline"
                >
                  Back to Login
                </a>
              </div>
            </div>
          </div>
          <div className="col-lg-6 d-lg-block d-none">
            <div className="account-img">
              <img src="assets/images/thumbs/Login-cuate.png" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordInner; 