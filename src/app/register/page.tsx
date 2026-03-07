'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './RegisterForm.module.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.body.classList.add('light');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className={styles.formShell}>
        <h2 className={styles.title}>Create your account</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.flexColumn}>
            <label htmlFor="register-name">Name</label>
          </div>
          <div className={styles.inputForm}>
            <input
              id="register-name"
              type="text"
              name="name"
              required
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter your name"
            />
          </div>

          <div className={styles.flexColumn}>
            <label htmlFor="register-email">Email</label>
          </div>
          <div className={styles.inputForm}>
            <input
              id="register-email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter your email"
            />
          </div>

          <div className={styles.flexColumn}>
            <label htmlFor="register-password">Password</label>
          </div>
          <div className={styles.inputForm}>
            <input
              id="register-password"
              type="password"
              name="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter your password (min 8 characters)"
            />
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.buttonSubmit}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className={styles.p}>
            Already have an account?
            <Link className={styles.span} href="/login">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
