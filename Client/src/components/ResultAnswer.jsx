import React, { PropTypes, Component } from 'react';
import { Link } from 'react-router';

import {
  InsightComparator,
} from '../components';

export class ResultAnswer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
    };
  }

  render() {
    const {
        correct,
        picked,
        character,
        referenceCharacter,
        movie,
        similarity,
        dimension,
    } = this.props;

    const imgStyle = {
      height: 130,
    };

    const BoxStyleColored = {
      width: 270,
      height: 250,
      float: 'left',
      margin: 15,
      marginLeft: 0,
      padding: 5,
      display: 'block',
      textAlign: 'center',
      overflow: 'hidden',
      background: '#B3E6A6',
    };

    const DetailsLinkStyle = {
      textAlign: 'right',
      fontSize: '75%',
      color: 'inherit',
    };

    if (!correct) {
      BoxStyleColored.background = picked ? '#E6B3A6' : '#DDDDDD';
    }

    // Get required values from character
    const name = character.names.resolved ||
                character.names.scriptUnified;
    const image = character.picture.path ||
      '//characterinsights.azurewebsites.net/img/placeholders/CharacterPortraitPlaceholder.png';


    // Create route and link for character details page
    const detailsRoute = `characters/${character._id}`;
    const detailsHref = this.context.router.createHref(detailsRoute);

    const content = !this.state.hovered ?
      (
      <div>
        <p><strong>{name}</strong><br />({movie})</p>
        <img alt={name} src={image} style={imgStyle} />
        <div>{dimension}: {(similarity * 100).toFixed(3)}%</div>
      </div>
      ) : (
      <div>
        <p><strong>{name}</strong></p>
        <InsightComparator
          values={character.insight}
          reference={referenceCharacter.insight}
        />
        <Link
          to={detailsRoute}
          target="_blank"
          onClick={(e) => { e.preventDefault(); window.open(detailsHref); }}
          style={DetailsLinkStyle}
        >
          Learn more about {name}
        </Link>
      </div>
      );


    return (
      <div
        style={BoxStyleColored}
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
      >
        {content}
      </div>
    );
  }
}

ResultAnswer.contextTypes = {
  router: PropTypes.func.isRequired,
};

ResultAnswer.propTypes = {
  picked: PropTypes.bool.isRequired,
  dimension: PropTypes.string.isRequired,
  similarity: PropTypes.number.isRequired,
  correct: PropTypes.bool.isRequired,
  character: PropTypes.object.isRequired,
  referenceCharacter: PropTypes.object,
  movie: PropTypes.string.isRequired,
};
