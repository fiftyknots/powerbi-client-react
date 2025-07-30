import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface AuthDebugProps {
  session: Session | null;
}

const AuthDebug: React.FC<AuthDebugProps> = ({ session }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingAuth, setIsTestingAuth] = useState(false);

  const testEdgeFunctionAuth = async () => {
    if (!session) {
      setTestResult({ error: 'No session available' });
      return;
    }

    setIsTestingAuth(true);
    setTestResult(null);

    try {
      console.log('Testing edge function with token:', session.access_token.substring(0, 20) + '...');
      
      const response = await supabase.functions.invoke('get-powerbi-embed-config', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      setTestResult({
        success: !response.error,
        data: response.data,
        error: response.error,
        status: 'Response received'
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'Request failed'
      });
    } finally {
      setIsTestingAuth(false);
    }
  };

  if (!session) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <strong>Auth Status:</strong> Not authenticated
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <strong>Auth Status:</strong> ✅ Authenticated
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ 
            background: 'none', 
            border: '1px solid #ccc', 
            borderRadius: '3px', 
            padding: '2px 6px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          {isExpanded ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>User:</strong> {session.user.email}<br/>
            <strong>User ID:</strong> {session.user.id}<br/>
            <strong>Token expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}<br/>
            <strong>Token preview:</strong> {session.access_token.substring(0, 30)}...
          </div>

          <button 
            onClick={testEdgeFunctionAuth}
            disabled={isTestingAuth}
            style={{ 
              background: '#117865', 
              color: 'white', 
              border: 'none', 
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: isTestingAuth ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              marginBottom: '10px'
            }}
          >
            {isTestingAuth ? 'Testing...' : 'Test Edge Function'}
          </button>

          {testResult && (
            <div style={{ 
              background: testResult.success ? '#d4edda' : '#f8d7da', 
              padding: '8px', 
              borderRadius: '3px',
              marginTop: '5px'
            }}>
              <strong>Test Result:</strong><br/>
              <pre style={{ fontSize: '10px', margin: '5px 0', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthDebug;