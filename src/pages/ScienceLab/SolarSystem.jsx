import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaGlobeEurope } from 'react-icons/fa';

const SolarSystem = () => {
  const planets = [
    { name: 'Mercury', color: 'bg-gray-400' },
    { name: 'Venus', color: 'bg-yellow-200' },
    { name: 'Earth', color: 'bg-blue-500' },
    { name: 'Mars', color: 'bg-red-500' },
    { name: 'Jupiter', color: 'bg-yellow-600' },
    { name: 'Saturn', color: 'bg-yellow-400' },
    { name: 'Uranus', color: 'bg-blue-200' },
    { name: 'Neptune', color: 'bg-blue-800' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20"
    >
      <div className="flex items-center gap-4">
        <Link to="/science-lab" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaArrowLeft className="text-xl" />
        </Link>
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <FaGlobeEurope />
          Our Solar System
        </h1>
      </div>

      <div className="relative h-[19rem] overflow-hidden sm:h-[27rem] lg:h-[37.5rem]">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.34] sm:scale-[0.51] lg:scale-[0.72]">
          <div className="absolute left-1/2 top-1/2 flex h-48 w-48 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-400 shadow-sun">
            <span className="font-bold text-white text-2xl">Sun</span>
          </div>
          {planets.map((planet, index) => (
            <motion.div
              key={planet.name}
              className="absolute inset-0"
              animate={{
                rotate: 360,
              }}
              transition={{
                repeat: Infinity,
                duration: 20 + index * 10,
                ease: "linear",
              }}
              style={{
                transformOrigin: 'center center',
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 h-8 w-8 rounded-full"
                style={{
                  transform: `translate(-50%, -50%) translate(${120 + index * 40}px) rotate(${index * 45}deg)`,
                }}
              >
                <div
                  className={`w-full h-full rounded-full ${planet.color} shadow-planet`}
                  title={planet.name}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10">
        {planets.map((planet) => (
          <div key={planet.name} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-soft">
            <div className={`w-6 h-6 rounded-full ${planet.color}`} />
            <span className="font-semibold text-gray-700 dark:text-gray-200">{planet.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SolarSystem;
