'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button, Input, OAuthButton } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login with:', { email, password });
    // TODO: Implement authentication logic
  };

  const handleGoogleLogin = () => {
    console.log('Login with Google');
    // TODO: Implement Google OAuth
  };

  const handlePinterestLogin = () => {
    console.log('Login with Pinterest');
    // TODO: Implement Pinterest OAuth
  };

  // Page wrapper styles
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    gap: '10px',
    position: 'relative',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#FEF8EE',
    fontFamily: 'Heebo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };

  // Main container (Frame 88)
  const containerStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    gap: '10px',
    height: 'auto',
    backgroundColor: '#FFFFFF',
    border: '4px solid #000000',
    boxShadow: '6px 6px 0px #000000',
    borderRadius: '24px',
    flex: 'none',
    order: 0,
    flexGrow: 0,
  };

  // Left panel (blue) styles
  const leftPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '50px 10px',
    gap: '10px',
    isolation: 'isolate',
    width: '624.5px',
    height: '702px',
    backgroundColor: '#202AED',
    borderRadius: '14px',
    flex: 'none',
    order: 0,
    alignSelf: 'stretch',
    flexGrow: 1,
    position: 'relative',
  };

  // Right panel (form) - Frame 90
  const rightPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px',
    gap: '10px',
    width: '624.5px',
    height: '702px',
    flex: 'none',
    order: 1,
    flexGrow: 1,
  };

  const formContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0px',
    gap: '32px',
    width: '560.5px',
    height: '638px',
    flex: 'none',
    order: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  };

  const titleStyle: React.CSSProperties = {
    width: '484px',
    height: '38px',
    fontFamily: 'Area Inktrap, Heebo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontStyle: 'normal',
    fontWeight: 800,
    fontSize: '42px',
    lineHeight: '90%',
    color: '#0D0D0D',
    flex: 'none',
    order: 0,
    flexGrow: 0,
  };

  const inputContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '6px',
    width: '560.5px',
    height: '83px',
    flex: 'none',
    order: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  };

  const passwordContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '16px',
    width: '560.5px',
    height: '122px',
    flex: 'none',
    order: 2,
    alignSelf: 'stretch',
    flexGrow: 0,
  };

  const forgotPasswordStyle: React.CSSProperties = {
    width: '146px',
    height: '23px',
    fontFamily: 'Heebo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '23px',
    letterSpacing: '-0.03em',
    textDecorationLine: 'underline',
    color: '#0D0D0D',
    flex: 'none',
    order: 1,
    flexGrow: 0,
    cursor: 'pointer',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '16px',
    width: '560.5px',
    height: '54px',
    flex: 'none',
    order: 3,
    alignSelf: 'stretch',
    flexGrow: 0,
  };

  const dividerContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0px',
    gap: '32px',
    width: '560.5px',
    height: '23px',
    flex: 'none',
    order: 4,
    alignSelf: 'stretch',
    flexGrow: 0,
  };

  const dividerLineStyle: React.CSSProperties = {
    width: '245px',
    height: '0px',
    border: '1px solid #000000',
    flex: 'none',
    flexGrow: 0,
  };

  const dividerTextStyle: React.CSSProperties = {
    width: '18px',
    height: '23px',
    fontFamily: 'Heebo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '23px',
    letterSpacing: '-0.03em',
    color: '#0D0D0D',
    flex: 'none',
    flexGrow: 0,
  };

  const oauthContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '14px',
    width: '560.5px',
    height: '158px',
    flex: 'none',
    order: 5,
    alignSelf: 'stretch',
    flexGrow: 0,
  };

  const oauthButtonsRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: '0px',
    gap: '10px',
    width: '560.5px',
    height: '90px',
    flex: 'none',
    order: 1,
    alignSelf: 'stretch',
    flexGrow: 1,
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Left Panel - Blue with Logo and Mascot */}
        <div style={leftPanelStyle}>
          {/* Logo UnBlank */}
          <Image
            src="/unblank-white.svg"
            alt="UnBlank"
            width={412.2}
            height={72}
            priority
            draggable={false}
            style={{
              flex: 'none',
              order: 0,
              flexGrow: 0,
              zIndex: 0,
            }}
          />

          {/* Mascot */}
          <Image
            src="/mascott.svg"
            alt="UnBlank Mascot"
            width={384}
            height={460}
            priority
            draggable={false}
            style={{
              flex: 'none',
              order: 1,
              flexGrow: 0,
              zIndex: 1,
              marginTop: '95px',
            }}
          />
        </div>

        {/* Right Panel - Login Form */}
        <div style={rightPanelStyle}>
          <div style={formContainerStyle}>
            <h1 style={titleStyle}>Bienvenue sur UnBlank</h1>

            {/* Email Input */}
            <div style={inputContainerStyle}>
              <Input
                type="email"
                label="Email"
                placeholder="Votre e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Input + Forgot Password */}
            <div style={passwordContainerStyle}>
              <div style={{ width: '100%' }}>
                <Input
                  type="password"
                  label="Mot de passe"
                  placeholder="***********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <a href="/forgot-password" style={forgotPasswordStyle}>
                Mot de passe oublié ?
              </a>
            </div>

            {/* Login Button */}
            <div style={buttonContainerStyle}>
              <Button
                type="submit"
                variant="primary"
                size="md"
                onClick={handleLogin}
                style={{
                  width: '560.5px',
                  height: '54px',
                  boxShadow: '3px 3px 0px #000000',
                }}
              >
                Se connecter
              </Button>
            </div>

            {/* Divider */}
            <div style={dividerContainerStyle}>
              <div style={dividerLineStyle}></div>
              <span style={dividerTextStyle}>ou</span>
              <div style={dividerLineStyle}></div>
            </div>

            {/* OAuth Buttons */}
            <div style={oauthContainerStyle}>
              <Button
                variant="outline"
                size="md"
                style={{
                  width: '560.5px',
                  height: '54px',
                  backgroundColor: '#FEF8EE',
                  boxShadow: '3px 3px 0px #000000',
                  flex: 'none',
                  order: 0,
                  alignSelf: 'stretch',
                  flexGrow: 0,
                }}
              >
                S'inscrire
              </Button>

              <div style={oauthButtonsRowStyle}>
                <OAuthButton
                  provider="google"
                  onClick={handleGoogleLogin}
                  style={{
                    width: '275.25px',
                    height: '90px',
                    flex: 'none',
                    order: 0,
                    alignSelf: 'stretch',
                    flexGrow: 1,
                  }}
                >
                  Continuer avec Google
                </OAuthButton>

                <OAuthButton
                  provider="pinterest"
                  onClick={handlePinterestLogin}
                  style={{
                    width: '275.25px',
                    height: '90px',
                    flex: 'none',
                    order: 1,
                    alignSelf: 'stretch',
                    flexGrow: 1,
                  }}
                >
                  Se connecter avec Pinterest
                </OAuthButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
