import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { theme } from '../../config/theme';

export function SignIn() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) throw error;
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
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
          Sign In to AutoCRM
        </h2>
        
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" loading={loading} fullWidth>
            <div className="w-full flex justify-center">
              Sign In
            </div>
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="tertiary"
            onClick={() => navigate('/signup')}
          >
            Don't have an account? Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
} 