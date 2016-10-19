import React, { PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';

export const IBL_ICON_SIZE_TINY = 'tiny';
export const IBL_ICON_SIZE_SMALL = 'small';
export const IBL_ICON_SIZE_MEDIUM = 'medium';
export const IBL_ICON_SIZE_LARGE = 'large';

const styles = {
  container: {},
  button: {},
  buttonSmall: {
    width: 72,
    height: 72,
    padding: 16,
  },
  buttonMedium: {
    width: 96,
    height: 96,
    padding: 24,
  },
  buttonLarge: {
    width: 120,
    height: 120,
    padding: 30,
  },
  icon: {},
  iconSmall: {
    width: 36,
    height: 36,
  },
  iconMedium: {
    width: 48,
    height: 48,
  },
  iconLarge: {
    width: 60,
    height: 60,
  },
};

function IconButtonListComponent({ size, style, buttonStyle, iconStyle, buttons, onButtonTap }) {
  // Merge styles
  let predefinedButtonStyle;
  let predefinedIconStyle;
  switch (size) {
    case IBL_ICON_SIZE_SMALL:
      predefinedButtonStyle = styles.buttonSmall;
      predefinedIconStyle = styles.iconSmall;
      break;
    case IBL_ICON_SIZE_MEDIUM:
      predefinedButtonStyle = styles.buttonMedium;
      predefinedIconStyle = styles.iconMedium;
      break;
    case IBL_ICON_SIZE_LARGE:
      predefinedButtonStyle = styles.buttonLarge;
      predefinedIconStyle = styles.iconLarge;
      break;
    default:
      // size === IBL_ICON_SIZE_TINY
      predefinedButtonStyle = styles.button;
      predefinedIconStyle = styles.icon;
  }
  const mergedContainerStyle = Object.assign({}, styles.container, style);
  const mergedButtonStyle = Object.assign({}, predefinedButtonStyle, buttonStyle);
  const mergedIconStyle = Object.assign({}, predefinedIconStyle, iconStyle);

  return (
    <div style={mergedContainerStyle}>
      {buttons.map(({ id, icon }) => (
        <IconButton
          key={id}
          onTouchTap={onButtonTap && onButtonTap.bind(null, id)}
          style={mergedButtonStyle}
          iconStyle={mergedIconStyle}
        >
          {icon}
        </IconButton>
      ))}
    </div>
  );
}

IconButtonListComponent.propTypes = {
  size: PropTypes.oneOf([
    IBL_ICON_SIZE_TINY,
    IBL_ICON_SIZE_SMALL,
    IBL_ICON_SIZE_MEDIUM,
    IBL_ICON_SIZE_LARGE,
  ]).isRequired,
  style: PropTypes.object,
  buttonStyle: PropTypes.object,
  iconStyle: PropTypes.object,
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.element.isRequired,
    }).isRequired
  ).isRequired,
  onButtonTap: PropTypes.func,
};

export const IconButtonList = IconButtonListComponent;
