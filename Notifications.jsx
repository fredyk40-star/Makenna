import { motion } from 'framer-motion';
import { FaBell, FaGift, FaExclamationCircle } from 'react-icons/fa';

const Notifications = () => {
  const notifications = [
    { id: 1, icon: <FaGift className="text-yellow-500" />, text: "You've unlocked the 'First Game' achievement!", time: '2m ago' },
    { id: 2, icon: <FaBell className="text-blue-500" />, text: 'New story available: The Lion and the Mouse.', time: '1h ago' },
    { id: 3, icon: <FaExclamationCircle className="text-red-500" />, text: 'Parent Zone: Weekly report is ready.', time: '3h ago' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700"
    >
      <div className="p-4 border-b dark:border-gray-700">
        <h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <div key={notification.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <div className="text-xl mt-1">{notification.icon}</div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{notification.text}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 text-center border-t dark:border-gray-700">
        <button className="text-sm font-semibold text-primary dark:text-blue-400 hover:underline">
          Mark all as read
        </button>
      </div>
    </motion.div>
  );
};

export default Notifications;