import mixpanel from 'mixpanel-browser';

// Safe wrapper functions that won't break the app if tracking fails
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    mixpanel.track(eventName, properties);
  } catch (error) {
    console.error('Mixpanel tracking error:', error);
  }
};

export const identifyUser = (userId: string) => {
  try {
    mixpanel.identify(userId);
  } catch (error) {
    console.error('Mixpanel identify error:', error);
  }
};

export const setUserProperties = (properties: Record<string, any>) => {
  try {
    mixpanel.people.set(properties);
  } catch (error) {
    console.error('Mixpanel set properties error:', error);
  }
};

// Specific event tracking functions
export const trackSignUp = (userId: number, email: string, name?: string, rollNo?: string, dob?: string) => {
  identifyUser(userId.toString());
  setUserProperties({
    '$email': email,
    '$name': name || '',
    'roll_no': rollNo || '',
    'date_of_birth': dob || ''
  });
  trackEvent('Sign Up', {
    user_id: userId,
    email,
    signup_method: 'email'
  });
};

export const trackSignIn = (userId: number, success: boolean) => {
  if (success) {
    identifyUser(userId.toString());
  }
  trackEvent('Sign In', {
    user_id: success ? userId : undefined,
    login_method: 'email',
    success
  });
};

export const trackError = (errorType: string, errorMessage: string, additionalInfo?: Record<string, any>) => {
  trackEvent('Error', {
    error_type: errorType,
    error_message: errorMessage,
    page_url: window.location.href,
    ...additionalInfo
  });
};

export const trackPageView = (pageUrl: string, pageTitle: string) => {
  trackEvent('Page View', {
    page_url: pageUrl,
    page_title: pageTitle
  });
};

export const trackConversion = (conversionType: string, conversionValue?: number) => {
  trackEvent('Conversion', {
    'Conversion Type': conversionType,
    'Conversion Value': conversionValue
  });
};
