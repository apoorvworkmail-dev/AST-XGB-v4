import React from 'react';
import { SettingsView } from '../components/SettingsView';

interface SettingsPageProps {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ theme, setTheme }) => {
  return (
    <div className="gd-consumer-app" style={{ minHeight: 'calc(100vh - 68px)', padding: '32px 0' }}>
      <div className="gd-container">
        <SettingsView theme={theme} setTheme={setTheme} />
      </div>
    </div>
  );
};
