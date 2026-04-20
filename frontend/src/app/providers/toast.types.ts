export type Toast = {
  id: number;
  title: string;
  message: string;
};

export type ShowToastInput = {
  title: string;
  message: string;
};

export type ToastContextType = {
  showToast: (toast: ShowToastInput) => void;
};
