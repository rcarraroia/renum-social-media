import React from "react";
import SignupForm from "@/components/auth/SignupForm";

const SignupPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <SignupForm />
    </div>
  );
};

export default SignupPage;