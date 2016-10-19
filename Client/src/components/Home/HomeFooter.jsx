import React, { PropTypes } from 'react';

import { FullWidthSection } from '../index';

const styles = {
  section: {
    textAlign: 'center',
  },
};

export default function HomeFooter({ backgroundColor, fontColor }) {
  // Apply theming
  styles.section.backgroundColor = backgroundColor;
  styles.section.color = fontColor;

  return (
    <FullWidthSection style={styles.section}>
      <p>
        Movie Character Insights powered by <a
          href="https://www.ibm.com/watson/developercloud/personality-insights.html"
          target="_blank"
          style={{ textDecoration: 'none', fontWeight: 'bold', color: 'white' }}
        >IBM's Personality Insights</a>
      </p>
    </FullWidthSection>
  );
}

HomeFooter.propTypes = {
  backgroundColor: PropTypes.string.isRequired,
  fontColor: PropTypes.string.isRequired,
};
