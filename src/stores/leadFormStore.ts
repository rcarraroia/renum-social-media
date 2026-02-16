import { create } from 'zustand';

export type ActivityType = 
  | 'consultora' 
  | 'politico' 
  | 'profissional_liberal'
  | 'educador'
  | 'fitness'
  | 'criador'
  | 'empreendedor'
  | 'estudante'
  | 'geral';

export type AppNameType = 'SocialFlow' | 'SmartGenius' | 'inFluency';

export type PriceType = '$29' | '$49' | '$99';

export type FormStep = 1 | 2 | 3 | 4 | 5;

export type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface LeadFormData {
  activity: ActivityType | null;
  appName: AppNameType | null;
  price: PriceType | null;
  priceWithCommission: PriceType | null;
  name: string;
  email: string;
  whatsapp: string;
}

interface LeadFormStore {
  currentStep: FormStep;
  formState: FormState;
  formData: LeadFormData;
  errorMessage: string;
  
  setCurrentStep: (step: FormStep) => void;
  setFormState: (state: FormState) => void;
  setActivity: (activity: ActivityType) => void;
  setAppName: (appName: AppNameType) => void;
  setPrice: (price: PriceType) => void;
  setPriceWithCommission: (price: PriceType) => void;
  setContactInfo: (name: string, email: string, whatsapp: string) => void;
  setErrorMessage: (message: string) => void;
  resetForm: () => void;
  canProceedToStep: (step: FormStep) => boolean;
}

const initialFormData: LeadFormData = {
  activity: null,
  appName: null,
  price: null,
  priceWithCommission: null,
  name: '',
  email: '',
  whatsapp: '',
};

export const useLeadFormStore = create<LeadFormStore>((set, get) => ({
  currentStep: 1,
  formState: 'idle',
  formData: initialFormData,
  errorMessage: '',

  setCurrentStep: (step) => set({ currentStep: step }),
  
  setFormState: (state) => set({ formState: state }),
  
  setActivity: (activity) => 
    set((state) => ({
      formData: { ...state.formData, activity },
    })),
  
  setAppName: (appName) => 
    set((state) => ({
      formData: { ...state.formData, appName },
    })),
  
  setPrice: (price) => 
    set((state) => ({
      formData: { ...state.formData, price },
    })),
  
  setPriceWithCommission: (priceWithCommission) => 
    set((state) => ({
      formData: { ...state.formData, priceWithCommission },
    })),
  
  setContactInfo: (name, email, whatsapp) => 
    set((state) => ({
      formData: { ...state.formData, name, email, whatsapp },
    })),
  
  setErrorMessage: (message) => set({ errorMessage: message }),
  
  resetForm: () => 
    set({
      currentStep: 1,
      formState: 'idle',
      formData: initialFormData,
      errorMessage: '',
    }),
  
  canProceedToStep: (step) => {
    const { formData } = get();
    
    switch (step) {
      case 1:
        return true;
      case 2:
        return formData.activity !== null;
      case 3:
        return formData.activity !== null && formData.appName !== null;
      case 4:
        return formData.activity !== null && formData.appName !== null && formData.price !== null;
      case 5:
        return formData.activity !== null && formData.appName !== null && formData.price !== null && formData.priceWithCommission !== null;
      default:
        return false;
    }
  },
}));
