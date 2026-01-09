"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { settingsApi, getAccessToken } from "@/lib/api";

interface CompanyData {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
}

interface CompanyContextType {
  companyData: CompanyData | null;
  logo: string | null;
  isLoading: boolean;
  updateCompanyData: (data: CompanyData) => Promise<void>;
  updateLogo: (logoUrl: string) => void;
  refreshCompanyData: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({
  children,
}) => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCompanyData = async () => {
    try {
      setIsLoading(true);

      // Check if user is authenticated before trying to load company data
      const token = getAccessToken();
      if (!token) {
        // User not authenticated, use default logo
        setLogo("/logo.png");
        setIsLoading(false);
        return;
      }

      const response = await settingsApi.getCompanySettings();
      const data = response.data.data || response.data;

      const normalized: CompanyData = {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        logo: data.logo || "",
      };

      setCompanyData(normalized);
      setLogo(data.logo || null);
    } catch (error: any) {
      const status = error?.response?.status;
      // Only log errors that are not auth related to avoid noisy console output
      if (status !== 401 && status !== 403) {
        console.error("Failed to load company data:", error);
      }
      // Fall back to default logo when the API call fails
      setCompanyData(null);
      setLogo("/logo.png");
    } finally {
      setIsLoading(false);
    }
  };

  const updateCompanyData = async (data: CompanyData) => {
    try {
      const response = await settingsApi.updateCompanySettings(data);
      const updated = response.data?.data || response.data;

      if (updated) {
        const normalized: CompanyData = {
          name: updated.name || "",
          email: updated.email || "",
          phone: updated.phone || "",
          address: updated.address || "",
          logo: updated.logo || "",
        };

        setCompanyData(normalized);
        if (updated.logo !== undefined) {
          setLogo(updated.logo || null);
        }
      }
    } catch (error) {
      console.error("Failed to update company data:", error);
      throw error;
    }
  };

  const updateLogo = (logoUrl: string) => {
    setLogo(logoUrl);
    if (companyData) {
      setCompanyData({ ...companyData, logo: logoUrl });
    }
  };

  const refreshCompanyData = async () => {
    await loadCompanyData();
  };

  useEffect(() => {
    loadCompanyData();
  }, []);

  const value: CompanyContextType = {
    companyData,
    logo,
    isLoading,
    updateCompanyData,
    updateLogo,
    refreshCompanyData,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};
