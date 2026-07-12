import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingBag, FaStar, FaCoins, FaLock, FaCheck } from 'react-icons/fa';
import { RewardsStore } from '../../services/RewardsStore';
import { GamificationService } from '../../services/GamificationService';
import { ChildAccountService } from '../../services/ChildAccountService';

const RewardsStoreComponent = () => {
  const [activeTab, setActiveTab] = useState('avatars');
  const [rewards, setRewards] = useState({});
  const [gamState, setGamState] = useState({ stars: 0, coins: 0 });
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [message, setMessage] = useState('');

  const childId = ChildAccountService.getActiveChildId();

  useEffect(() => {
    if (childId) {
      setRewards(RewardsStore.getAllRewards());
      setGamState(GamificationService.getState(childId));
      setPurchasedItems(RewardsStore.getPurchasedItems(childId));
    }
  }, [childId]);

  const handlePurchase = (itemId) => {
    const result = RewardsStore.purchaseItem(childId, itemId);
    
    if (result.success) {
      setGamState(GamificationService.getState(childId));
      setPurchasedItems(RewardsStore.getPurchasedItems(childId));
      setMessage(result.message);
    } else {
      setMessage(result.message);
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  const isPurchased = (itemId) => purchasedItems.includes(itemId);

  const RewardCard = ({ item }) => {
    const purchased = isPurchased(item.id);
    
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gray-700 rounded-lg p-4 flex flex-col items-center"
      >
        <div className="text-4xl mb-2">{item.icon || '🎁'}</div>
        <h3 className="font-bold text-center mb-2">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-gray-400 mb-2">{item.description}</p>
        )}
        <div className="flex items-center gap-1 mb-3">
          <FaStar className="text-yellow-400" />
          <span>{item.price} stars</span>
        </div>
        
        {purchased ? (
          <div className="flex items-center gap-2 text-green-400">
            <FaCheck />
            <span>Owned</span>
          </div>
        ) : (
          <button
            onClick={() => handlePurchase(item.id)}
            disabled={gamState.stars < item.price}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              gamState.stars >= item.price
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            {gamState.stars < item.price && <FaLock />}
            Buy Now
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Currency Display */}
      <div className="flex justify-center gap-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <FaStar className="text-yellow-400 text-xl" />
          <span className="text-xl font-bold">{gamState.stars} Stars</span>
        </div>
        <div className="flex items-center gap-2">
          <FaCoins className="text-amber-400 text-xl" />
          <span className="text-xl font-bold">{gamState.coins} Coins</span>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-purple-600 rounded-lg text-center"
        >
          {message}
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {['avatars', 'themes', 'stickers'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg capitalize ${
              activeTab === tab ? 'bg-purple-600' : 'bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {rewards[activeTab]?.map(item => (
          <RewardCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default RewardsStoreComponent;