import { Font } from '@react-pdf/renderer';

// Register fonts with Unicode support
// This font has proper support for Unicode characters including ₹
Font.register({
  family: 'Noto Sans',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSans/NotoSans-Bold.ttf',
      fontWeight: 'bold',
      fontStyle: 'normal',
    }
  ]
});

// Helper function to get currency symbol
export const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'CAD': return 'C$';
    case 'AUD': return 'A$';
    case 'INR': return '₹';
    default: return '$';
  }
};
