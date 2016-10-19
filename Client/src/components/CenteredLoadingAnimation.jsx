import React from 'react';
import CircularProgress from 'material-ui/CircularProgress';

export function CenteredLoadingAnimation() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
      <CircularProgress size={2} />
    </div>
  );
}
