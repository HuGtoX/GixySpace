"use client";

import React, { useEffect } from "react";
import RegisterForm from "./RegisterForm";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, []);

  if (user) {
    return null;
  }

  return <RegisterForm />;
}
