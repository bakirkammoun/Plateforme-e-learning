import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import GridShape from "../../components/common/GridShape";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import PageMeta from "../../components/common/PageMeta";
import axios, { AxiosError } from "axios";

interface FormData {
  fname: string;
  lname: string;
  email: string;
  password: string;
  role: string;
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fname: "",
    lname: "",
    email: "",
    password: "",
    role: "student", 
  });
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);  // To track if OTP was sent

  // Handle form input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle signup request
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/signup", {
        firstName: formData.fname,
        lastName: formData.lname,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      setOtpSent(true); // Show OTP input field
      setSuccessMessage(response.data.message || "OTP sent to your email.");
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setErrorMessage(err.response.data.message || "An error occurred");
      } else {
        setErrorMessage("An error occurred");
      }
      setSuccessMessage("");
    }
  };

  // Handle OTP verification request
  const handleVerifyOTP = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email: formData.email,
        otp: otp,
      });

      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setErrorMessage(err.response.data.message || "Invalid OTP");
      } else {
        setErrorMessage("Invalid OTP");
      }
    }
  };

  return (
    <>
      <PageMeta
        title="Sign Up | Your App"
        description="Create an account to get started"
      />
      <div className="relative flex w-full h-screen overflow-hidden bg-white z-1 dark:bg-gray-900">
        <div className="flex flex-col flex-1 p-6 rounded-2xl sm:rounded-none sm:border-0 sm:p-8">
          <div className="w-full max-w-md pt-5 mx-auto sm:py-10">
            <Link
              to="/"
              className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Back to dashboard
            </Link>
          </div>
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Sign Up
              </h1>
            </div>
            {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
            {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <Label>
                      First Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="fname"
                      placeholder="Enter your first name"
                      value={formData.fname}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label>
                      Last Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lname"
                      placeholder="Enter your last name"
                      value={formData.lname}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-brand-500"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>
                <div>
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </form>

            {otpSent && (
              <form onSubmit={handleVerifyOTP}>
                <div>
                  <Label>
                    Enter OTP<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="otp"
                    name="otp"
                    placeholder="Enter the OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                  >
                    Verify OTP
                  </button>
                </div>
              </form>
            )}

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="relative items-center justify-center flex-1 hidden p-8 z-1 bg-brand-950 dark:bg-white/5 lg:flex">
          <GridShape />
        </div>
      </div>
    </>
  );
};

export default SignUp;
