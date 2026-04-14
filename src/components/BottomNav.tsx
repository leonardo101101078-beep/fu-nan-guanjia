import type { TabId } from '../App';
import { IconLedger, IconOverview, IconProfile } from './Icons';
import type { SVGProps, ReactElement } from 'react';
import './BottomNav.css';

type IconComponent = (props: SVGProps<SVGSVGElement> & { size?: number }) => ReactElement;

const TABS: { id: TabId; label: string; Icon: IconComponent }[] = [
  { id: 'ledger',   label: '帳本', Icon: IconLedger },
  { id: 'overview', label: '總覽', Icon: IconOverview },
  { id: 'profile',  label: '個人', Icon: IconProfile },
];

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export default function BottomNav({ activeTab, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="bottom-nav-icon">
            <tab.Icon size={22} />
          </span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
