import axiosInstance from './axios';
import { fSQLDate } from './formatTime';

const appendToFormData = (formData, prefix, value) => {
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        Object.keys(item).forEach((itemKey) => {
          appendToFormData(formData, `${prefix}[${index}][${itemKey}]`, item[itemKey]);
        });
      });
    } else if (value instanceof Date) {
      const formattedValue = fSQLDate(value);
      formData.append(prefix, formattedValue);
    } else if (value instanceof File) {
      formData.append(prefix, value);
    } else if (value !== undefined && value !== null) {
      // eslint-disable-next-line no-prototype-builtins
      if (value.hasOwnProperty('value')) {
        formData.append(prefix, value.value);
      } else {
        const isAddressProperty = prefix.toLowerCase().includes('address');
        // Convert object to JSON string if it's an address property
        if (isAddressProperty) {
          const jsonValue = JSON.stringify(value);
          formData.append(prefix, jsonValue);
        } else {
          Object.keys(value).forEach((key) => {
            appendToFormData(formData, `${prefix}[${key}]`, value[key]);
          });
        }
      }
    }
  } else {
    formData.append(prefix, value);
  }
};

const convertObjectToFormData = (obj) => {
  const formData = new FormData();

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      appendToFormData(formData, key, value);
    }
  });

  return formData;
};