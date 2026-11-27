import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useChildAccount } from '../../context/ChildAccountContext';
import { REWARD_CATALOG } from '../../data/rewardCatalog';
import { RewardsStore } from '../../services/RewardsStore';
import { StickerBookService } from '../../services/StickerBookService';

const STICKER_EMOJIS = ['⭐', '🌟', '💖', '🌈', '🦋', '🍓', '🚀', '🐻', '🎈', '🏅', '🌻', '🐣', '🍀', '🎵', '☀️'];

const stickerIcon = (pack, index) => STICKER_EMOJIS[index % STICKER_EMOJIS.length] || pack?.icon || '⭐';

const StickerBook = () => {
  const { childId } = useChildAccount();
  const [ownedPacks, setOwnedPacks] = useState([]);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [book, setBook] = useState({ pages: [], activePageId: null });

  useEffect(() => {
    const refresh = () => {
      const purchased = RewardsStore.getPurchasedItems(childId);
      const packs = REWARD_CATALOG.stickers.filter((pack) => purchased.includes(pack.id));
      setOwnedPacks(packs);
      setBook(StickerBookService.getBook(childId));
    };
    refresh();
    return StickerBookService.subscribe(refresh);
  }, [childId]);

  useEffect(() => {
    if (ownedPacks.length === 0) {
      setSelectedPackId(null);
      setSelectedSticker(null);
    } else if (!ownedPacks.some((pack) => pack.id === selectedPackId)) {
      setSelectedPackId(ownedPacks[0].id);
      setSelectedSticker(null);
    }
  }, [ownedPacks, selectedPackId]);

  const selectedPack = ownedPacks.find((pack) => pack.id === selectedPackId);
  const activePage = book.pages.find((page) => page.id === book.activePageId) || book.pages[0];

  const handlePageClick = (event) => {
    if (!selectedPack || selectedSticker === null || !activePage) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.detail === 0 ? 50 : ((event.clientX - rect.left) / rect.width) * 100;
    const y = event.detail === 0 ? 50 : ((event.clientY - rect.top) / rect.height) * 100;
    StickerBookService.placeSticker(childId, activePage.id, {
      packId: selectedPack.id,
      stickerIndex: selectedSticker,
      x,
      y,
    });
  };

  if (ownedPacks.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
        <div className="text-5xl mb-4">🧩</div>
        <h2 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">Your sticker book is waiting</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Buy a sticker pack with stars, then place stickers on your pages.
        </p>
        <Link to="/rewards" className="inline-block mt-4 px-5 py-2 rounded-xl bg-purple-500 text-white font-semibold">
          Visit rewards store
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft">
        <h2 className="font-baloo text-lg font-bold text-gray-800 dark:text-white mb-3">My sticker packs</h2>
        <div className="flex flex-wrap gap-2">
          {ownedPacks.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => { setSelectedPackId(pack.id); setSelectedSticker(null); }}
              aria-pressed={selectedPackId === pack.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
                selectedPackId === pack.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              <span aria-hidden="true">{pack.icon}</span>
              {pack.name}
              <span className="text-xs opacity-80">{pack.count}</span>
            </button>
          ))}
        </div>

        {selectedPack && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Pick a sticker, then tap anywhere on the page. Tap a placed sticker to remove it.
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: Math.min(selectedPack.count, 15) }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedSticker(index)}
                  aria-pressed={selectedSticker === index}
                  aria-label={`Select ${stickerIcon(selectedPack, index)} sticker`}
                  className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-transform hover:scale-110 ${
                    selectedSticker === index
                      ? 'bg-purple-100 dark:bg-purple-900/50 ring-2 ring-purple-500'
                      : 'bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  {stickerIcon(selectedPack, index)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sticker book pages">
            {book.pages.map((page, index) => (
              <button
                key={page.id}
                type="button"
                onClick={() => StickerBookService.setActivePage(childId, page.id)}
                aria-pressed={activePage?.id === page.id}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  activePage?.id === page.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                Page {index + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => StickerBookService.addPage(childId)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
              aria-label="Add a new sticker page"
            >
              <FaPlus /> New page
            </button>
          </div>
          {activePage && activePage.placements.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => StickerBookService.clearPage(childId, activePage.id)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                Clear page
              </button>
              {book.pages.length > 1 && (
                <button
                  type="button"
                  onClick={() => StickerBookService.removePage(childId, activePage.id)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                  aria-label="Delete this page"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          )}
        </div>

        {activePage && (
          <div
            className="relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10 overflow-hidden"
          >
            <button
              type="button"
              onClick={handlePageClick}
              aria-label="Tap to place the selected sticker on this page"
              className="absolute inset-0 w-full h-full"
            />
            {activePage.placements.map((placement) => {
              const pack = REWARD_CATALOG.stickers.find((item) => item.id === placement.packId);
              return (
                <button
                  key={placement.id}
                  type="button"
                  onClick={() => StickerBookService.removePlacement(childId, activePage.id, placement.id)}
                  className="absolute text-4xl leading-none transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform drop-shadow"
                  style={{ left: `${placement.x}%`, top: `${placement.y}%` }}
                  aria-label={`Remove ${pack?.name || 'sticker'} from page`}
                >
                  {stickerIcon(pack, placement.stickerIndex)}
                </button>
              );
            })}
            {activePage.placements.length === 0 && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-purple-400 dark:text-purple-300">
                {selectedSticker === null ? 'Choose a sticker above to start decorating' : 'Tap anywhere to place your sticker'}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default StickerBook;
