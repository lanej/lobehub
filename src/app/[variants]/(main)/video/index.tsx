'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import NavHeader from '@/features/NavHeader';

const DesktopVideoPage = memo(() => {
  return (
    <>
      <NavHeader />
      <Flexbox
        align="center"
        height={'100%'}
        justify="center"
        style={{ overflowY: 'auto', position: 'relative' }}
        width={'100%'}
      >
        Video Generation (Coming Soon)
      </Flexbox>
    </>
  );
});

DesktopVideoPage.displayName = 'DesktopVideoPage';

export default DesktopVideoPage;
