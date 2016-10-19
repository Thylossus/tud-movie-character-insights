import React, { PropTypes } from 'react';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import ContentClear from 'material-ui/svg-icons/content/clear';

export function SearchField({
    currentQuery,
    onQueryChanged,
    onClearClicked,
    hint,
    label,
  }) {
  const handleClearedSearch = e => {
    e.preventDefault();
    e.stopPropagation();

    if (onQueryChanged) {
      // in order to allow throttling
      onQueryChanged('');
    }
    if (onClearClicked) {
      onClearClicked();
    }
  };

  return (
    <div className="searchField">
      <TextField
        hintText={hint}
        floatingLabelText={label}
        onChange={onQueryChanged}
        value={currentQuery}
      />
      <IconButton
        tooltip="Clear"
        tooltipPosition="top-right"
        onTouchEnd={handleClearedSearch}
        onMouseUp={handleClearedSearch}
        disabled={currentQuery === ''}
      >
        <ContentClear />
      </IconButton>
    </div>
  );
}

SearchField.propTypes = {
  currentQuery: PropTypes.string,
  onQueryChanged: PropTypes.func,
  onClearClicked: PropTypes.func,
  hint: PropTypes.string,
  label: PropTypes.string,
};
