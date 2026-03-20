/**
 * Sanitizes returnTo parameter to prevent Open Redirect attacks.
 * Only allows relative paths starting with / and matching whitelist.
 * 
 * @param {string} userInput - User-provided returnTo value
 * @returns {string} - Safe path or default '/account'
 * 
 * @example
 * sanitizeReturnTo('/checkout') // => '/checkout'
 * sanitizeReturnTo('https://evil.com') //=> '/account'
 */
function sanitizeReturnTo(userInput) {
  const defaultPath = '/account';
  
  if (!userInput || typeof userInput !== 'string') {
    return defaultPath;
  }
  
  // Reject absolute URLs (http://, https://, //)
  if (userInput.startsWith('http://') || 
      userInput.startsWith('https://') || 
      userInput.startsWith('//')) {
    return defaultPath;
  }
  
  // Only allow paths starting with /
  if (!userInput.startsWith('/')) {
    return defaultPath;
  }
  
  // Extract pathname (before ? or #) to validate against whitelist
  const pathOnly = userInput.split('?')[0].split('#')[0];
  
  // Whitelist of allowed path prefixes
  const allowedPaths = [
    '/account',
    '/checkout',
    '/cart',
    '/products',
    '/orders',
    '/payments',
  ];
  
  // Check if path matches any allowed prefix
  const isAllowed = allowedPaths.some(allowed => 
    pathOnly === allowed || pathOnly.startsWith(allowed + '/')
  );
  
  if (!isAllowed) {
    return defaultPath;
  }
  
  // Return the full input (with query/fragment) if path is valid
  return userInput;
}

module.exports = { sanitizeReturnTo };
