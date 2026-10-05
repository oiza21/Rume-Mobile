import type { Session } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "./config";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

/**
 * The app's own return address: exp://192.168.1.5:8081/--/auth-callback in
 * Expo Go, rume://auth-callback in the installed app.
 */
export const redirectTo = makeRedirectUri({ path: "auth-callback" });

/**
 * Supabase sends the login to the website's /auth/mobile page (already an
 * approved redirect), which forwards it straight to the app address above.
 * This avoids depending on Supabase matching exp:// or rume:// addresses.
 */
const bridgeUrl = `${API_URL}/auth/mobile?to=${encodeURIComponent(redirectTo)}`;

type AuthState = {
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

async function sessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  if (params.error_description) throw new Error(params.error_description.replace(/\+/g, " "));
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }
  if (!params.access_token || !params.refresh_token) throw new Error("Sign-in didn't complete. Please try again.");
  const { error } = await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token });
  if (error) throw error;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // Same Google provider and Supabase project as the website = same account.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: bridgeUrl, skipBrowserRedirect: true },
    });
    if (error) throw error;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "success") await sessionFromUrl(result.url);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return <Ctx.Provider value={{ session, loading, signInWithGoogle, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
