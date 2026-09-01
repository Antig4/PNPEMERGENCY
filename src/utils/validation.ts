export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Email address is required.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function validateMobileNumber(mobile: string): string | null {
  if (!mobile || !mobile.trim()) {
    return 'Mobile number is required.';
  }
  // Accepts standard PH mobile numbers like 09171234567 or +639171234567
  const cleanNum = mobile.replace(/\s+|-/g, '');
  const phMobileRegex = /^(09|\+639)\d{9}$/;
  if (!phMobileRegex.test(cleanNum)) {
    return 'Enter a valid PH mobile number (e.g. 0917 123 4567).';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  return null;
}

export function validateConfirmPassword(password: string, confirmPassword?: string): string | null {
  if (!confirmPassword) {
    return 'Please confirm your password.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}

export function validateFullName(name: string): string | null {
  if (!name || !name.trim()) {
    return 'Full name is required.';
  }
  if (name.trim().length < 2) {
    return 'Please enter your full name.';
  }
  return null;
}
