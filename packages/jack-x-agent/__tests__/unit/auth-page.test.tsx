/**
 * Auth Page Component Tests
 * Tests signup/login form rendering and behavior
 * 
 * Note: These tests focus on basic rendering and state management.
 * Integration tests should cover full form submission flows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
  setUserSession: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import AuthPage from '@/app/auth/page';

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Initial State', () => {
    it('should show loading state while checking signup status', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<AuthPage />);

      expect(screen.getByText('loading...')).toBeInTheDocument();
    });

    it('should show login form when signup is not allowed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signupAllowed: false }),
      });

      render(<AuthPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /let me in/i })).toBeInTheDocument();
      });

      // Login form should be visible
      expect(screen.getByPlaceholderText(/enter the secret sauce/i)).toBeInTheDocument();
    });

    it('should show signup form when signup is allowed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signupAllowed: true }),
      });

      render(<AuthPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create my account/i })).toBeInTheDocument();
      });

      // Signup form fields should be visible
      expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/min 8 characters/i)).toBeInTheDocument();
    });
  });

  describe('Guest Login', () => {
    it('should show guest login button on login form', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signupAllowed: false }),
      });

      render(<AuthPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /let me in/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /see what I'm cooking/i })).toBeInTheDocument();
    });

    it('should show guest login button on signup form', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signupAllowed: true }),
      });

      render(<AuthPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create my account/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /see what I'm cooking/i })).toBeInTheDocument();
    });
  });

  describe('Branding', () => {
    it('should show jack branding', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signupAllowed: false }),
      });

      render(<AuthPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /let me in/i })).toBeInTheDocument();
      });

      expect(screen.getByText('jack')).toBeInTheDocument();
      expect(screen.getByText(/writer's block is for normies/i)).toBeInTheDocument();
    });
  });
});
