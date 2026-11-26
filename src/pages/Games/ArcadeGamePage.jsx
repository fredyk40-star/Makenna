import { Navigate, useParams } from 'react-router-dom';
import ArcadeGame from '../../components/games/ArcadeGame';

const ArcadeGamePage = ({ collection, fallbackPath, aliases = {} }) => {
  const { gameId } = useParams();
  const resolvedId = aliases[gameId] || gameId;
  const game = collection.find((entry) => entry.id === resolvedId);

  if (!game) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <ArcadeGame game={game} />;
};

export default ArcadeGamePage;
