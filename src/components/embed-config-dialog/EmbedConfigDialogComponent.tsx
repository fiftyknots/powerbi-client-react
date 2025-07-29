// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useEffect } from "react";
import { provideFluentDesignSystem, fluentDialog, fluentButton, fluentTextField } from '@fluentui/web-components';
import { provideReactWrapper } from '@microsoft/fast-react-wrapper';
import './EmbedConfigDialogComponent.css';

const { wrap } = provideReactWrapper(React, provideFluentDesignSystem());

export const FluentDialog = wrap(fluentDialog());
export const FluentButton = wrap(fluentButton());
export const FluentTextField = wrap(fluentTextField());


type TokenType = 'Aad' | 'Embed';

interface EmbedReportDialogProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onEmbed: (embedUrl: string, accessToken: string, tokenType: TokenType) => void;
}

const EmbedConfigDialog = ({
  isOpen,
  onRequestClose,
  onEmbed,
}: EmbedReportDialogProps) => {
  const [token, setToken] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [tokenType, setTokenType] = useState<TokenType>('Aad');
  const [areFieldsFilled, setAreFieldsFilled] = useState<boolean>(false);


  useEffect(() => {
    setAreFieldsFilled(!!token && !!embedUrl);
  }, [token, embedUrl]);

  const onTokenChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setToken(event.target.value);
  }

  const onTokenTypeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setTokenType(event.target.value as TokenType);
  }

  const onEmbedUrlChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setEmbedUrl(event.target.value);
  }


  const runConfig = (): void => {
    if (token && embedUrl) {
      onEmbed(embedUrl, token, tokenType);
    }
  };


  const hideEmbedConfigDialog = (): void => {
    setToken("");
    setEmbedUrl("");
    setTokenType('Aad');
    onRequestClose();
  };

  return (
    isOpen ? (
      <FluentDialog>
        <div className="dialog-header">
          <h2 className="dialog-title">Provide Power BI Token</h2>
          <button className="close-icon-button" onClick={hideEmbedConfigDialog}>&#x2715;</button>
        </div>
        <div className="dialog-main">
          <div style={{ marginBottom: '1em' }}>
            <label>
              <input type="radio" name="tokenType" value="Aad" checked={tokenType === 'Aad'} onChange={onTokenTypeChange} />
              Microsoft Entra (AAD) Token
            </label>
            <label style={{ marginLeft: '1em' }}>
              <input type="radio" name="tokenType" value="Embed" checked={tokenType === 'Embed'} onChange={onTokenTypeChange} />
              Embed Token (App Owns Data)
            </label>
          </div>

          {tokenType === 'Aad' ? (
            <>
              <p>
                To obtain a Microsoft Entra (AAD) token, follow the <a href="https://learn.microsoft.com/rest/api/power-bi/embed-token/generate-token" target="_blank" rel="noopener noreferrer">Microsoft Entra Token</a> documentation. You can use tools like <a href="https://jwt.ms" target="_blank" rel="noopener noreferrer">jwt.ms</a> to inspect your token.
              </p>
              <span>Insert your Microsoft Entra (AAD) token</span>
            </>
          ) : (
            <>
              <p>
                To obtain an Embed Token (App Owns Data), you must call the <a href="https://learn.microsoft.com/power-bi/developer/embedded/embed-tokens?tabs=embed-for-customers" target="_blank" rel="noopener noreferrer">Power BI REST API - Generate Embed Token</a> from a backend service using a service principal. See the <a href="https://learn.microsoft.com/power-bi/developer/embedded/embed-service-principal" target="_blank" rel="noopener noreferrer">Service Principal authentication guide</a> for details.
              </p>
              <span>Insert your Embed Token</span>
            </>
          )}
          <FluentTextField name="token" value={token} onInput={onTokenChange} className="dialog-field" aria-label="Token" />

          <p>Use the <a href="https://learn.microsoft.com/rest/api/power-bi/reports/get-report-in-group" target="_blank" rel="noopener noreferrer">Get Report In Group</a> REST API to get your embed URL.</p>
          <span>Insert your embed URL</span>
          <FluentTextField name="embedUrl" value={embedUrl} onInput={onEmbedUrlChange} className="dialog-field" aria-label="Embed URL" />
        </div>
        <div className="dialog-buttons">
          <FluentButton className={`run-button ${areFieldsFilled ? "active" : ""}`} disabled={!areFieldsFilled} onClick={runConfig}>Run</FluentButton>
          <FluentButton className="close-button" onClick={hideEmbedConfigDialog}>Close</FluentButton>
        </div>
      </FluentDialog>
    ) : null
  );
};

export default EmbedConfigDialog;