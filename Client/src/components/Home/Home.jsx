import React, { PropTypes } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import { darkWhite, grey200, grey900 } from 'material-ui/styles/colors';
import typography from 'material-ui/styles/typography';
import withWidth, { SMALL, LARGE } from 'material-ui/utils/withWidth';
import AVMovie from 'material-ui/svg-icons/av/movie';
import ActionAccountCircle from 'material-ui/svg-icons/action/account-circle';
import ICFileUpload from 'material-ui/svg-icons/file/file-upload';
import ActionAssignment from 'material-ui/svg-icons/action/assignment';
import ActionSearch from 'material-ui/svg-icons/action/search';

import Header from './HomeHeader.jsx';
import FeatureList from './HomeFeatures.jsx';
import Footer from './HomeFooter.jsx';

const featureIconStyle = {
  height: 100,
  width: 100,
};
const features = [
  { title: 'Movies', to: '/movies', icon: <AVMovie style={featureIconStyle} /> },
  {
    title: 'Characters',
    to: '/characters',
    icon: <ActionAccountCircle style={featureIconStyle} />,
  },
  { title: 'Quiz', to: '/quiz-start', icon: <ActionAssignment style={featureIconStyle} /> },
  { title: 'Upload Text', to: '/upload-text', icon: <ICFileUpload style={featureIconStyle} /> },
  { title: 'Search', to: '/search', icon: <ActionSearch style={featureIconStyle} /> },
];

function HomeComponent({ muiTheme, width }) {
  const large = width === LARGE;
  const small = width === SMALL;

  return (
    <div>
      <Header
        large={large}
        fontColor={darkWhite}
        backgroundColor={muiTheme.baseTheme.palette.primary1Color}
        fontWeight={typography.fontWeightLight}
      />
      <FeatureList
        features={features}
        backgroundColor={grey200}
        small={small}
      />
      <Footer backgroundColor={grey900} fontColor={darkWhite} />
    </div>
  );
}

HomeComponent.propTypes = {
  width: PropTypes.number.isRequired,
  muiTheme: PropTypes.object.isRequired,
};

export const Home = muiThemeable()(
  withWidth()(
    HomeComponent
  )
);
