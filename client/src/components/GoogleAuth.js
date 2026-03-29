import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const GoogleAuth = () => {
  const { showToast } = useToast();

  const handleSuccess = async (response) => {
    try {
      const { credential } = response;
      
      // Standardize the API URL
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      // Send token to backend
      const res = await axios.post(`${API_URL}/auth/google`, {
        token: credential
      });

      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(res.data));
      
      // Dispatch a "faked" login action or just reload/navigate
      // Ideally, the authSlice should have a special action for this, 
      // but for now, we can manually update or just reload the app
      window.location.href = '/'; 
    } catch (error) {
       console.error('Google Auth Error:', error.response?.data?.message || error.message);
       showToast('Google Authentication encountered a hitch. Please try again.', 'error');
    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
    showToast('Secure Google Login was unsuccessful. Please try again.', 'error');
  };

  return (
    <div className="flex justify-center w-full my-4">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="outline"
        size="large"
        width="100%"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
};

export default GoogleAuth;
