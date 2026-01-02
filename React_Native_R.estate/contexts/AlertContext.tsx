import React, { createContext, useContext, useState, ReactNode } from "react";
import CustomAlert from "@/components/CustomAlert";
import ToastNotification from "@/components/ToastNotification";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertConfig {
  title: string;
  message: string;
  type: AlertType;
  buttons?: AlertButton[];
  duration?: number; // for toast notifications
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
  showToast: (message: string, type?: AlertType, duration?: number) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider = ({ children }: AlertProviderProps) => {
  const [alert, setAlert] = useState<AlertConfig | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: AlertType;
    id: number;
  } | null>(null);

  const showAlert = (config: AlertConfig) => {
    setAlert(config);
  };

  const showToast = (
    message: string,
    type: AlertType = "info",
    duration: number = 3000
  ) => {
    const id = Date.now();
    setToast({ message, type, id });

    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, duration);
  };

  const hideAlert = () => {
    setAlert(null);
  };

  return (
    <AlertContext.Provider value={{ showAlert, showToast, hideAlert }}>
      {children}
      {alert && (
        <CustomAlert
          visible={true}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          buttons={alert.buttons}
          onClose={hideAlert}
        />
      )}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </AlertContext.Provider>
  );
};
