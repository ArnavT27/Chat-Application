// Utility functions for cookie management

export const getCookie = (name) => {
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
    return cookie ? cookie.split('=')[1] : null;
};

export const hasToken = () => {
return getCookie('token') !== null;
};

export const clearToken = () => {
document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

// console.log(getCookie("token"));