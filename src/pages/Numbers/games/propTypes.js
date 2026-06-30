import PropTypes from 'prop-types';

export const gamePropTypes = {
  game: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    icon: PropTypes.string,
    category: PropTypes.string,
    difficulty: PropTypes.string,
    estimatedTime: PropTypes.number,
    minNumber: PropTypes.number,
    maxNumber: PropTypes.number,
    color: PropTypes.string
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
  onScoreUpdate: PropTypes.func.isRequired,
  onStarsUpdate: PropTypes.func.isRequired
};