import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { theme } from '../../config/theme';

export function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      if (error) {
        if (error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          console.error('Signup error:', error);
          setError(error.message || 'Error creating account. Please try again.');
        }
        return;
      }
      setSuccess('Please check your email for a confirmation link to complete your registration.');
      // Don't navigate immediately, let user see the success message
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-[${theme.colors.primary.background}]`}>
      <div className="max-w-md w-full px-6 py-8 bg-white rounded-lg shadow-md">
        <h2 className={`text-2xl font-bold mb-6 text-center text-[${theme.colors.primary.text}]`}>
          Create an Account
        </h2>
        
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-500 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded bg-green-50 text-green-600 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            fullWidth
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            fullWidth
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            fullWidth
          />

          <Button type="submit" loading={loading} fullWidth>
            Sign Up
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="text"
            onClick={() => navigate('/signin')}
          >
            Already have an account? Sign In
          </Button>
        </div>
      </div>
    </div>
  );
} 