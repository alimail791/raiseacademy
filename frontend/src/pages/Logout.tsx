import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { isAppMode, isFramed, tellYneetApp } from "../utils/appMode";

// /logout: the YNeet app sends students here when they log out, so they are
// signed out of the website too. Then it replaces itself with the home page
// (or the login page inside the Android app), so Back can't return to the app.
const Logout = () => {
  const { logout } = useAuth();
  useEffect(() => {
    logout();
    if (isFramed()) tellYneetApp({ type: "yneet-logged-out" });
    window.location.replace(isAppMode() ? "/login?app=1" : "/");
  }, []);
  return <p className="max-w-md mx-auto px-4 py-20 text-center text-ink/70">Signing you out…</p>;
};

export default Logout;
