import React, { PropTypes } from 'react';
import FlatButton from 'material-ui/FlatButton';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import IconNavigateBefore from 'material-ui/svg-icons/image/navigate-before';
import IconNavigateNext from 'material-ui/svg-icons/image/navigate-next';
import spacing from 'material-ui/styles/spacing';
import range from 'lodash/range';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.desktopGutter,
    paddingTop: spacing.desktopGutter,
  },
  containerWhenSmall: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottonContainerWhenSmall: {
    flexWrap: 'wrap',
  },
  buttonStyle: {
    minWidth: spacing.desktopGutter,
    width: spacing.desktopGutter * 2,
  },
  buttonStyleWhenSmall: {
    maxWidth: spacing.desktopGutter * 1.8,
  },
};

const itemsPerPageOptions = [10, 20, 50, 100];

export function Pagination({
  itemsPerPage,
  numPages,
  currentPage,
  small,
  maxDisplayedPages = 5,
  onNext,
  onPrev,
  onPageTap,
  onItemsPerPageChange,
}) {
  // Styling
  const containerStyle = Object.assign(
    {},
    styles.container,
    small && styles.containerWhenSmall
  );
  const buttonStyle = Object.assign(
    {},
    styles.buttonStyle,
    small && styles.buttonStyleWhenSmall
  );
  const buttonContainerStyle = Object.assign(
    {},
    styles.buttonContainer,
    styles.bottonContainerWhenSmall
  );

  const padding = Math.floor((maxDisplayedPages - 2) / 2);
  const buttonCenterRange =
    range(currentPage - padding, currentPage + padding + 1, 1)
      .filter(num => num > 0 && num <= numPages)
      .map(num => {
        const touchHandler = onPageTap && num !== currentPage ?
          onPageTap.bind(null, num) :
          undefined;
        return (
          <FlatButton
            key={num}
            label={num}
            primary={num === currentPage}
            onTouchTap={touchHandler}
            style={buttonStyle}
          />
        );
      });

  let buttonStart;
  let buttonEnd;

  if (currentPage - padding > 1) {
    buttonStart = [
      <FlatButton
        key={1}
        label={1}
        onTouchTap={onPageTap && onPageTap.bind(null, 1)}
        style={buttonStyle}
      />,
      <FlatButton
        key="..."
        label="..."
        disabled
        style={buttonStyle}
      />,
    ];
  }

  if (currentPage + padding < numPages) {
    buttonEnd = [
      <FlatButton
        key="..."
        label="..."
        disabled
        style={buttonStyle}
      />,
      <FlatButton
        key={numPages}
        label={numPages}
        onTouchTap={onPageTap && onPageTap.bind(null, numPages)}
        style={buttonStyle}
      />,
    ];
  }

  const itemsPerPageMenuItems =
    itemsPerPageOptions.map(numItems => (
      <MenuItem key={numItems} value={numItems} primaryText={numItems} />
    ));

  return (
    <div style={containerStyle}>
      <div>
        <SelectField
          value={itemsPerPage}
          onChange={onItemsPerPageChange}
          floatingLabelText="Items per page"
        >
          {itemsPerPageMenuItems}
        </SelectField>
      </div>
      <div style={buttonContainerStyle}>
        <FlatButton
          icon={<IconNavigateBefore />}
          disabled={currentPage === 1}
          onTouchTap={onPrev}
          style={buttonStyle}
        />
        {buttonStart}
        {buttonCenterRange}
        {buttonEnd}
        <FlatButton
          icon={<IconNavigateNext />}
          disabled={currentPage === numPages}
          onTouchTap={onNext}
          style={buttonStyle}
        />
      </div>
    </div>
  );
}

Pagination.propTypes = {
  itemsPerPage: PropTypes.number.isRequired,
  numPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  small: PropTypes.bool,
  maxDisplayedPages: PropTypes.number,
  onNext: PropTypes.func,
  onPrev: PropTypes.func,
  onPageTap: PropTypes.func,
  onItemsPerPageChange: PropTypes.func,
};
