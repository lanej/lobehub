import React, { memo } from 'react';

import { NavPanelPortal } from '@/features/NavPanel';
import SideBarLayout from '@/features/NavPanel/SideBarLayout';

import Header from './Header';

const Sidebar = memo(() => {
  return (
    <NavPanelPortal navKey="video">
      <SideBarLayout header={<Header />} />
    </NavPanelPortal>
  );
});

Sidebar.displayName = 'VideoSidebar';

export default Sidebar;
