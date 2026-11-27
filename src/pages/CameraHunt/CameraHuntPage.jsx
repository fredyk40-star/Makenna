import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaArrowLeft, FaCamera, FaCheck, FaRedo, FaShieldAlt, FaStop, FaTrophy,
} from 'react-icons/fa';
import { useChildAccount } from '../../context/ChildAccountContext';
import { CameraHuntService, detectColor } from '../../services/CameraHuntService';

const CameraHuntPage = () => {
  const { childId } = useChildAccount();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [huntId, setHuntId] = useState('colours');
  const [progress, setProgress] = useState(() => CameraHuntService.getProgress(childId, 'colours'));
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState('');
  const [sample, setSample] = useState(null);
  const [detected, setDetected] = useState(null);
  const [message, setMessage] = useState('');
  const hunt = CameraHuntService.getHunt(huntId);

  useEffect(() => {
    const refresh = () => setProgress(CameraHuntService.getProgress(childId, huntId));
    refresh();
    return CameraHuntService.subscribe(refresh);
  }, [childId, huntId]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  const startCamera = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot open the camera here. Try HTTPS or the installed app.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError('Camera access was blocked. Allow it in your browser, then try again.');
    }
  };

  const sampleFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!cameraOn || !video?.videoWidth || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 32;
    canvas.height = 32;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const start = 10;
    const end = 22;
    const pixels = ctx.getImageData(start, start, end - start, end - start).data;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      r += pixels[index];
      g += pixels[index + 1];
      b += pixels[index + 2];
    }
    const count = pixels.length / 4;
    const rgb = [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
    setSample(rgb);
    setDetected(hunt.detection === 'colour' ? detectColor(rgb, hunt.targets) : null);
  };

  const confirmTarget = (targetId) => {
    const result = CameraHuntService.markFound(childId, huntId, targetId);
    if (!result) return;
    setMessage(result.completed
      ? 'Hunt complete! You earned 10 stars.'
      : result.unchanged ? 'You already found this one.' : 'Great find!');
  };

  const resetHunt = () => {
    CameraHuntService.reset(childId, huntId);
    setSample(null);
    setDetected(null);
    setMessage('Hunt restarted.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center gap-3">
        <Link to="/games" className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Back to games">
          <FaArrowLeft className="text-xl" />
        </Link>
        <div>
          <h1 className="font-baloo text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaCamera /> Camera Scavenger Hunt
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Look around you, find the clues and tick them off.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CameraHuntService.getHunts().map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setHuntId(option.id);
              setSample(null);
              setDetected(null);
              setMessage('');
            }}
            aria-pressed={huntId === option.id}
            className={`px-4 py-2 rounded-xl font-semibold text-sm ${
              huntId === option.id
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            }`}
          >
            {option.icon} {option.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft space-y-4">
          <h2 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
            {hunt.icon} {hunt.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">{hunt.instruction}</p>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" aria-label="Camera preview" />
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 text-center px-4">
                <FaCamera className="text-4xl mb-2" />
                <p className="text-sm">Turn on the camera to explore, or use the list to tick clues you find.</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}

          <div className="flex flex-wrap gap-2">
            {!cameraOn ? (
              <button type="button" onClick={startCamera} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold">
                <FaCamera /> Turn on camera
              </button>
            ) : (
              <>
                <button type="button" onClick={stopCamera} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold">
                  <FaStop /> Stop camera
                </button>
                {hunt.detection === 'colour' && (
                  <button type="button" onClick={sampleFrame} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold">
                    Check this colour
                  </button>
                )}
              </>
            )}
            <button type="button" onClick={resetHunt} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold">
              <FaRedo /> Restart
            </button>
          </div>

          {sample && (
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
              <span
                className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: `rgb(${sample.join(',')})` }}
                aria-hidden="true"
              />
              <p className="text-sm text-gray-700 dark:text-gray-200">
                {detected
                  ? `This looks like ${detected.label.replace('Something ', '').toLowerCase()}! You can tick it off.`
                  : 'No hunt colour detected. Try pointing at something brighter.'}
              </p>
            </div>
          )}

          <p className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FaShieldAlt className="mt-0.5 shrink-0" />
            Camera pictures stay on this device and are never saved or uploaded. You can complete
            every hunt without the camera.
          </p>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">Clue checklist</h2>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
              {progress.found.length}/{hunt.targets.length}
            </span>
          </div>

          <ul className="space-y-2">
            {hunt.targets.map((target) => {
              const found = progress.found.includes(target.id);
              return (
                <li key={target.id}>
                  <button
                    type="button"
                    onClick={() => confirmTarget(target.id)}
                    disabled={found}
                    className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                      found
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-400 text-green-800 dark:text-green-200'
                        : 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white hover:border-blue-400'
                    }`}
                  >
                    <span className="text-3xl" aria-hidden="true">{target.visual}</span>
                    <span className="flex-1 font-semibold">{target.label}</span>
                    {found && <FaCheck aria-label="Found" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {message && (
            <p className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-900/30 p-3 text-sm text-blue-700 dark:text-blue-200" role="status">
              {message}
            </p>
          )}

          {progress.completed && (
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 p-4 text-center">
              <FaTrophy className="text-3xl text-yellow-600 mx-auto" />
              <p className="font-baloo font-bold text-gray-800 dark:text-white mt-2">Hunt complete!</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {progress.starsAwarded ? '10 stars added to your account.' : 'Well explored!'}
              </p>
              <Link to="/rewards" className="inline-block mt-3 text-sm font-semibold text-blue-600 dark:text-blue-300">
                Visit rewards store →
              </Link>
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
};

export default CameraHuntPage;
