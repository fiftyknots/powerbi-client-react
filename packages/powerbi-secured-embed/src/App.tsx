import React, { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { models, Report } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './supabaseClient';
import './App.css';

interface EmbedConfig {
  type: string;
  id: string;
  embedUrl: string;
  accessToken: string;
  tokenId: string;
  expiration: string;
  settings?: any;
}

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [embedConfig, setEmbedConfig] = useState<EmbedConfig | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);

  // Authentication state management
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch embed configuration when user is authenticated
  useEffect(() => {
    if (session && !embedConfig) {
      fetchEmbedConfig();
    }
  }, [session]);

  const fetchEmbedConfig = async () => {
    if (!session) return;

    setIsLoadingEmbed(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-powerbi-embed-config', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch embed configuration');
      }

      if (data && data.success) {
        setEmbedConfig(data.data);
      } else {
        throw new Error(data?.error || 'Invalid response from embed service');
      }
    } catch (err) {
      console.error('Error fetching embed config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Power BI report');
    } finally {
      setIsLoadingEmbed(false);
    }
  };

  const refreshToken = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-powerbi-embed-config', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to refresh token');
      }

      if (data && data.success && report) {
        await report.setAccessToken(data.data.accessToken);
        setEmbedConfig(data.data);
        console.log('Token refreshed successfully');
      }
    } catch (err) {
      console.error('Error refreshing token:', err);
      setError('Failed to refresh authentication token');
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
    } else {
      setEmbedConfig(null);
      setReport(null);
      setError(null);
    }
  };

  // Event handlers for Power BI embed
  const eventHandlersMap = new Map([
    ['loaded', () => console.log('Report loaded')],
    ['rendered', () => console.log('Report rendered')],
    ['error', (event: any) => {
      console.error('Power BI error:', event.detail);
      setError('Power BI report error: ' + event.detail.message);
    }],
    ['tokenExpired', () => {
      console.log('Token expired, refreshing...');
      refreshToken();
    }],
  ]);

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>Welcome to Secure Power BI Dashboard</h2>
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)} className="close-error">
                ×
              </button>
            </div>
          )}
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            redirectTo={window.location.origin}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Secure Power BI Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="close-error">
              ×
            </button>
          </div>
        )}

        {isLoadingEmbed && (
          <div className="loading-embed">Loading Power BI report...</div>
        )}

        {embedConfig && !isLoadingEmbed && (
          <div className="report-container">
            <PowerBIEmbed
              embedConfig={{
                type: 'report',
                id: embedConfig.id,
                embedUrl: embedConfig.embedUrl,
                accessToken: embedConfig.accessToken,
                tokenType: models.TokenType.Embed,
                settings: embedConfig.settings || {
                  panes: {
                    filters: {
                      expanded: false,
                      visible: true,
                    },
                    pageNavigation: {
                      visible: true,
                    },
                  },
                },
              }}
              eventHandlers={eventHandlersMap}
              cssClassName="powerbi-report"
              getEmbeddedComponent={(embeddedReport: any) => {
                setReport(embeddedReport as Report);
              }}
            />
          </div>
        )}

        {!embedConfig && !isLoadingEmbed && !error && (
          <div className="no-report">
            <p>No Power BI report configuration available.</p>
            <button onClick={fetchEmbedConfig} className="retry-btn">
              Retry
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;