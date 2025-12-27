export const debugTest = (msg: string, data?: any) => {
  if (process.env.NODE_ENV === 'test') {
    console.log(`[TEST DEBUG] ${msg}`, data || '');
  }
};
