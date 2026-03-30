import Breadcrumb from "@/components/Breadcrumb";
import CertificateOne from "@/components/CertificateOne";
import FAQInnerOne from "@/components/FAQInnerOne";
import FooterOne from "@/components/FooterOne";
import Header from "@/components/Header";
import TestimonialsThree from "@/components/TestimonialsThree";
import Animation from "@/helper/Animation";

export const metadata = {
  title: "Smartech - LMS, Tutors, Education & Online Course NEXT JS Template",
  description:
    "Smartech is a comprehensive and modern NEXT JS template designed for online education platforms, learning management systems (LMS), tutors, educational institutions, and online courses. It's the perfect solution for creating an engaging and interactive online learning experience for students, educators, and institutions. Whether you're offering online courses, running a tutoring platform, or managing an educational website, Smartech provides the tools to help you succeed. This template is tailored to meet the needs of educators, administrators, and students, providing a seamless and engaging user experience.",
};

const page = () => {
  return (
    <>
      {/* Animation */}
      <Animation />

      {/* Header */}
      <Header />

      {/* Breadcrumb */}
      <Breadcrumb title={"FAQ"} />

      {/* FAQInnerOne */}
      <FAQInnerOne />

      {/* TestimonialsThree */}
      <TestimonialsThree />

      {/* CertificateOne */}
      <CertificateOne />

      {/* FooterOne */}
      <FooterOne />
    </>
  );
};

export default page;
