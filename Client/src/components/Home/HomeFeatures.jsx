import React, { PropTypes } from 'react';
import spacing from 'material-ui/styles/spacing';

import { FullWidthSection } from '../index';
import FeatureItem from './HomeFeatureItem.jsx';

const renderFeatures = (features, style) => features.map(({ to, title, icon }) => (
  <FeatureItem
    style={style}
    key={to}
    title={title}
    to={to}
    icon={icon}
  />
));

const styles = {
  section: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  sectionWhenSmall: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {},
  itemWhenSmall: {
    marginTop: spacing.desktopGutter * 0.5,
    marginBottom: spacing.desktopGutter * 0.5,
    minWidth: '300px',
  },
};

export default function HomeFeatures({ features, backgroundColor, small }) {
  // Apply theming
  styles.section.backgroundColor = backgroundColor;
  const sectionStyle = Object.assign(
    {},
    styles.section,
    { backgroundColor },
    small && styles.sectionWhenSmall
  );
  const itemStyle = Object.assign(
    {},
    styles.item,
    small && styles.itemWhenSmall
  );

  return (
    <FullWidthSection style={sectionStyle}>
      {renderFeatures(features, itemStyle)}
    </FullWidthSection>
  );
}

HomeFeatures.propTypes = {
  features: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      icon: PropTypes.element.isRequired,
    })
  ),
  backgroundColor: PropTypes.string.isRequired,
  small: PropTypes.bool.isRequired,
};
