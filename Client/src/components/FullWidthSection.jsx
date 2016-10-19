import React, { PropTypes } from 'react';
import ClearFix from 'material-ui/internal/ClearFix';
import spacing from 'material-ui/styles/spacing';
import withWidth, { SMALL, MEDIUM, LARGE } from 'material-ui/utils/withWidth';

const desktopGutter = spacing.desktopGutter;
const styles = {
  root: {
    padding: desktopGutter,
    boxSizing: 'border-box',
  },
  rootWhenSmall: {
    paddingTop: desktopGutter * 2,
    paddingBottom: desktopGutter * 2,
  },
  rootWhenLarge: {
    paddingTop: desktopGutter * 3,
    paddingBottom: desktopGutter * 3,
  },
};

function FullWidthSectionComponent({ style, width, children }) {
  return (
    <ClearFix
      style={Object.assign(
        {},
        styles.root,
        width === SMALL && styles.rootWhenSmall,
        (width === LARGE || width === MEDIUM) && styles.rootWhenLarge,
        style)}
    >
      {children}
    </ClearFix>
  );
}

FullWidthSectionComponent.propTypes = {
  children: PropTypes.node,
  style: PropTypes.object,
  width: PropTypes.number.isRequired,
};

export const FullWidthSection = withWidth()(FullWidthSectionComponent);
