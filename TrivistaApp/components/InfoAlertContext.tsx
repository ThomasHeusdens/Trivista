import { createContext, useContext, useState } from "react";

type InfoAlertContextType = {
  infoVisible: boolean;
  setInfoVisible: (val: boolean) => void;
};

const InfoAlertContext = createContext<InfoAlertContextType | undefined>(undefined);

export const InfoAlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [infoVisible, setInfoVisible] = useState(false);
  return (
    <InfoAlertContext.Provider value={{ infoVisible, setInfoVisible }}>
      {children}
    </InfoAlertContext.Provider>
  );
};

export const useInfoAlert = () => {
  const context = useContext(InfoAlertContext);
  if (!context) {
    throw new Error("useInfoAlert must be used within an InfoAlertProvider");
  }
  return context;
};
