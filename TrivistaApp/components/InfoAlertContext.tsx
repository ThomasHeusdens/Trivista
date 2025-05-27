/**
 * Provides a context for managing the visibility of an informational alert.
 * Used to toggle alert display from top navigation or other components.
 * @module
 */
import { createContext, useContext, useState } from "react";

/**
 * Defines the shape of the InfoAlert context state.
 * @interface
 */
type InfoAlertContextType = {
  infoVisible: boolean;
  setInfoVisible: (val: boolean) => void;
};

/**
 * React context for InfoAlert visibility management.
 * Defaults to undefined to enforce usage within a provider.
 */
const InfoAlertContext = createContext<InfoAlertContextType | undefined>(undefined);

/**
 * Context provider component for InfoAlert visibility state.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.JSX.Element} Context provider for InfoAlert visibility
 */
export const InfoAlertProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [infoVisible, setInfoVisible] = useState(false);
  return (
    <InfoAlertContext.Provider value={{ infoVisible, setInfoVisible }}>
      {children}
    </InfoAlertContext.Provider>
  );
};

/**
 * Custom hook for accessing the InfoAlert context.
 * Must be used within an `InfoAlertProvider`.
 *
 * @returns {InfoAlertContextType} InfoAlert context state and setter
 * @throws {Error} If used outside of a provider
 */
export const useInfoAlert = () => {
  const context = useContext(InfoAlertContext);
  if (!context) {
    throw new Error("useInfoAlert must be used within an InfoAlertProvider");
  }
  return context;
};
