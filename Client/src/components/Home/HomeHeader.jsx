import React, { PropTypes } from 'react';
import AVMovie from 'material-ui/svg-icons/av/movie';

import { FullWidthSection } from '../index';

const styles = {
  header: {
    overflow: 'hidden',
    paddingTop: 0,
  },
  tagline: {
    margin: '16px auto 0 auto',
    textAlign: 'center',
    maxWidth: 575,
  },
  icon: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  svg: {
    width: 150,
    height: 150,
  },
  h1: {
    margin: 0,
  },
  h2: {
    fontSize: 20,
    lineHeight: '28px',
    marginTop: 0,
    paddingTop: 19,
    marginBottom: 13,
    letterSpacing: 0,
  },
  taglineWhenLarge: {
    marginTop: 32,
  },
  h1WhenLarge: {
    fontSize: 56,
  },
  h2WhenLarge: {
    fontSize: 24,
    lineHeight: '32px',
    paddingTop: 16,
    marginBottom: 12,
  },
};

export default function HomeHeader({ large, fontColor, backgroundColor, fontWeight }) {
  // Apply theming
  styles.header.backgroundColor = backgroundColor;
  styles.h1.color = fontColor;
  styles.h1.fontWeight = fontWeight;

  styles.h2 = Object.assign({}, styles.h1, styles.h2);

  if (large) {
    // Apply large styles
    styles.tagline = Object.assign({}, styles.tagline, styles.taglineWhenLarge);
    styles.h1 = Object.assign({}, styles.h1, styles.h1WhenLarge);
    styles.h2 = Object.assign({}, styles.h2, styles.h2WhenLarge);
  }

  // TODO: replace with real logo
  return (
    <FullWidthSection style={styles.header}>
      <div style={styles.icon}>
        <AVMovie style={styles.svg} color={fontColor} />
      </div>
      <div style={styles.tagline}>
        <h1 style={styles.h1}>
          Movie Character Insights
        </h1>
        <h2 style={styles.h2}>
          Personality analyses for your favorite movie characters
        </h2>
      </div>
    </FullWidthSection>
  );
}

HomeHeader.propTypes = {
  large: PropTypes.bool.isRequired,
  fontColor: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string.isRequired,
  fontWeight: PropTypes.number.isRequired,
};
