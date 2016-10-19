import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import React, { PropTypes } from 'react';

const renderItems = items => items.map(({ text, to, icon }) => (
  <MenuItem
    key={to}
    leftIcon={icon}
  >
    {text}
  </MenuItem>
));

function NavigationMenuComponent({ items, onItemTouchTap }) {
  return (
    <Menu onItemTouchTap={onItemTouchTap}>
      {renderItems(items)}
    </Menu>
  );
}

NavigationMenuComponent.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    icon: PropTypes.element,
  })).isRequired,
  onItemTouchTap: PropTypes.func,
};

export const NavigationMenu = NavigationMenuComponent;
