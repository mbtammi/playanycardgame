// Secure Firebase operations through backend API
// NO client-side Firebase configuration - all operations go through our secure backend

interface EmailEntry {
  id: string;
  timestamp: string;
  source: string;
}

interface NewsletterStats {
  totalSubscribers: number;
  latestSignups: EmailEntry[];
}

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : '/api';

// Email collection functions - all through secure backend
export const addEmailToFirestore = async (email: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add email');
    }

    return true;
  } catch (error) {
    console.error('Error adding email:', error);
    throw error;
  }
};

export const getEmailStats = async (): Promise<NewsletterStats> => {
  try {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_authenticated');
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to fetch stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching email stats:', error);
    throw error;
  }
};

export const adminLogin = async (password: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const { token } = await response.json();
    sessionStorage.setItem('admin_token', token);
    sessionStorage.setItem('admin_authenticated', 'true');
    
    return true;
  } catch (error) {
    console.error('Error during admin login:', error);
    throw error;
  }
};
