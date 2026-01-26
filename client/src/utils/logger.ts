// Logger utility - automatically disables console.log in production

const isDevelopment = import.meta.env.DEV;

export const logger = {
 log: (...args: any[]) => {
 if (isDevelopment) {
 console.log(...args);
 }
 },
 
 error: (...args: any[]) => {
 // Always log errors, even in production
 console.error(...args);
 },
 
 warn: (...args: any[]) => {
 if (isDevelopment) {
 console.warn(...args);
 }
 },
 
 info: (...args: any[]) => {
 if (isDevelopment) {
 console.info(...args);
 }
 },
 
 debug: (...args: any[]) => {
 if (isDevelopment) {
 console.debug(...args);
 }
 }
};

// Export as default for easier imports
export default logger;
