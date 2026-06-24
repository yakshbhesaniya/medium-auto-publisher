import Cookies from 'js-cookie';

export const setAuthToken = (token: string) => {
  Cookies.set('token', token, { expires: 7 }); // 7 days
};

export const saveToken = setAuthToken;

export const saveUser = (user: any) => {
  Cookies.set('user', JSON.stringify(user), { expires: 7 });
};

export const getUserFromStorage = () => {
  const user = Cookies.get('user');
  return user ? JSON.parse(user) : null;
};

export const removeAuthToken = () => {
  Cookies.remove('token');
  Cookies.remove('user');
};

export const clearToken = removeAuthToken;
export const clearUser = removeAuthToken;

export const getAuthToken = () => {
  return Cookies.get('token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};
