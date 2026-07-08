import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeveloperService } from '../../services/DeveloperService';
import { UpdateService } from '../../services/UpdateService';
import { FaUser, FaLock, FaTrash, FaUndo, FaDownload, FaUpload, FaArchive, FaUnlock, FaBan, FaStar, FaCertificate, FaChartBar, FaDatabase, FaBell, FaCog, FaSignOutAlt, FaSync, FaRocket, FaHistory, FaUsers, FaFilter, FaCalendarAlt, FaExclamationTriangle, FaRobot, FaVolumeUp, FaComment, FaPlus, FaMinus, FaEye, FaPlay } from 'react-icons/fa';

const DeveloperDashboard = () => {
  const [children, setChildren] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [selectedPreviewChildren, setSelectedPreviewChildren] = useState([]);
  const [activeTab, setActiveTab] = useState('children');
  const [backups, setBackups] = useState([]);
  const [featureFlags, setFeatureFlags] = useState({});
  const [updates, setUpdates] = useState([]);
  const [trashBin, setTrashBin] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logFilters, setLogFilters] = useState({ action: '', startDate: '', endDate: '' });
  const [selectedLogAction, setSelectedLogAction] = useState('');
  const [pinModal, setPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [updateModal, setUpdateModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [downloadModal, setDownloadModal] = useState(false);
  const [previewUpdateId, setPreviewUpdateId] = useState(null);
  const [updateData, setUpdateData] = useState({
    version: '',
    type: 'feature',
    target: 'all',
    targetIds: ''
  });

  // AI Assistant State
  const [aiConfig, setAiConfig] = useState({});
  const [aiVoiceCommands, setAiVoiceCommands] = useState([]);
  const [aiStatistics, setAiStatistics] = useState({});
  const [aiCommandModal, setAiCommandModal] = useState(false);
  const [newCommand, setNewCommand] = useState({ phrase: '', response: '', category: 'custom' });

  useEffect(() => {
    loadChildren();
    loadBackups();
    setFeatureFlags(DeveloperService.getFeatureFlags());
    setUpdates(UpdateService.getUpdateHistory());
  }, []);

  useEffect(() => {
    const results = searchQuery ? DeveloperService.searchChildren(searchQuery) : DeveloperService.getAllChildren();
    setChildren(results);
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'trash') {
      loadTrashBin();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'ai') {
      setAiConfig(DeveloperService.getAIConfig());
      setAiVoiceCommands(DeveloperService.getAIVoiceCommands());
      setAiStatistics(DeveloperService.getAIStatistics());
    }
  }, [activeTab]);

  const loadAIData = () => {
    setAiConfig(DeveloperService.getAIConfig());
    setAiVoiceCommands(DeveloperService.getAIVoiceCommands());
    setAiStatistics(DeveloperService.getAIStatistics());
  };

  const handleUpdateAIConfig = (newConfig) => {
    DeveloperService.updateAIConfig(newConfig);
    loadAIData();
    DeveloperService.logAction('AI_CONFIG_UPDATE', { changes: Object.keys(newConfig) });
  };

  const handleAddAICommand = () => {
    if (!newCommand.phrase.trim() || !newCommand.response.trim()) return;
    DeveloperService.addAIVoiceCommand(newCommand);
    loadAIData();
    setNewCommand({ phrase: '', response: '', category: 'custom' });
    setAiCommandModal(false);
  };

  const handleDeleteAICommand = (commandId) => {
    if (window.confirm('Delete this voice command?')) {
      DeveloperService.deleteAIVoiceCommand(commandId);
      loadAIData();
    }
  };

  const handleClearAIInteractions = () => {
    if (window.confirm('Clear all AI interaction history? This cannot be undone.')) {
      DeveloperService.clearAIInteractions();
      loadAIData();
    }
  };

  const loadChildren = () => {
    setChildren(DeveloperService.getAllChildren());
    setSelectedChildren([]);
  };

  const loadBackups = () => {
    setBackups(DeveloperService.getBackups());
  };

  const loadTrashBin = () => {
    setTrashBin(DeveloperService.getTrashBin());
  };

  const loadLogs = () => {
    setLogs(DeveloperService.getLogs(logFilters));
  };

  const applyLogFilters = () => {
    setLogFilters({
      action: selectedLogAction,
      startDate: logFilters.startDate,
      endDate: logFilters.endDate
    });
    setLogs(DeveloperService.getLogs({
      action: selectedLogAction,
      startDate: logFilters.startDate,
      endDate: logFilters.endDate
    }));
  };

  const clearLogFilters = () => {
    setSelectedLogAction('');
    setLogFilters({ action: '', startDate: '', endDate: '' });
    setLogs(DeveloperService.getLogs());
  };

  const handleSelectAll = () => {
    if (selectedChildren.length === children.length) {
      setSelectedChildren([]);
    } else {
      setSelectedChildren(children.map(c => c.childId));
    }
  };

  const handleSelectChild = (childId) => {
    setSelectedChildren(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleSelectPreviewChild = (childId) => {
    setSelectedPreviewChildren(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleBulkAction = (action) => {
    if (!selectedChildren.length) return;

    switch (action) {
      case 'delete':
        if (window.confirm(`Delete ${selectedChildren.length} children?`)) {
          selectedChildren.forEach(id => DeveloperService.deleteChild(id));
          selectedChildren.forEach(id => DeveloperService.logAction('DELETE', { childId: id, count: selectedChildren.length }));
          loadChildren();
          loadTrashBin();
        }
        break;
      case 'restore':
        selectedChildren.forEach(id => DeveloperService.restoreChild(id));
        DeveloperService.logAction('RESTORE', { count: selectedChildren.length });
        loadChildren();
        break;
      case 'reset_progress':
        if (window.confirm(`Reset progress for ${selectedChildren.length} children?`)) {
          selectedChildren.forEach(id => DeveloperService.resetChildProgress(id, 'all'));
          DeveloperService.logAction('RESET_PROGRESS', { count: selectedChildren.length });
        }
        break;
      case 'reset_stars':
        selectedChildren.forEach(id => DeveloperService.resetChildProgress(id, 'stars'));
        DeveloperService.logAction('RESET_STARS', { count: selectedChildren.length });
        break;
    }
    loadChildren();
  };

  const handleCreateUpdate = () => {
    if (!updateData.version) {
      setError('Version is required');
      return;
    }
    const targetIds = updateData.targetIds ? updateData.targetIds.split(',').map(s => s.trim()) : [];
    const updateId = UpdateService.createUpdate({
      ...updateData,
      targetIds
    });
    setUpdates(UpdateService.getUpdateHistory());
    setUpdateModal(false);
    setUpdateData({ version: '', type: 'feature', target: 'all', targetIds: '' });
    setPreviewUpdateId(updateId);
    setPreviewModal(true);
  };

  const handleAssignPreviewChildren = () => {
    if (previewUpdateId && selectedPreviewChildren.length > 0) {
      UpdateService.addPreviewChildren(previewUpdateId, selectedPreviewChildren);
      setUpdates(UpdateService.getUpdateHistory());
      setPreviewModal(false);
      setSelectedPreviewChildren([]);
      setPreviewUpdateId(null);
    }
  };

  const handlePromoteUpdate = (updateId) => {
    if (window.confirm('Promote this preview update to pending? It will be ready for staged rollout.')) {
      UpdateService.promoteUpdate(updateId);
      setUpdates(UpdateService.getUpdateHistory());
      DeveloperService.logAction('UPDATE_PROMOTE', { updateId });
    }
  };

  const handleActivateUpdate = (updateId) => {
    UpdateService.activateUpdate(updateId);
    setUpdates(UpdateService.getUpdateHistory());
  };

  const handleRollbackUpdate = (updateId) => {
    if (window.confirm('Rollback this update?')) {
      UpdateService.rollbackUpdate(updateId);
      setUpdates(UpdateService.getUpdateHistory());
    }
  };

  const handleCreateBackup = () => {
    DeveloperService.createBackup();
    DeveloperService.logAction('BACKUP', { count: backups.length + 1 });
    loadBackups();
  };

  const handleRestoreBackup = (timestamp) => {
    if (window.confirm('Restore from this backup? Current data will be overwritten.')) {
      DeveloperService.restoreBackup(timestamp);
      DeveloperService.logAction('RESTORE_BACKUP', { timestamp });
      loadChildren();
    }
  };

  const handleToggleFeature = (key) => {
    const newValue = !featureFlags[key];
    const newFlags = { ...featureFlags, [key]: newValue };
    setFeatureFlags(newFlags);
    DeveloperService.updateFeatureFlags(newFlags);
    DeveloperService.logAction('FEATURE_TOGGLE', { feature: key, newState: newValue ? 'enabled' : 'disabled' });
  };

  const handleDownloadPreviewConfig = () => {
    const previewUpdate = updates.find(u => u.id === previewUpdateId);
    const childrenList = previewUpdate ? previewUpdate.previewChildren : selectedChildren;
    
    const config = UpdateService.generateDownloadConfig(
      childrenList,
      previewUpdate?.version || updateData.version,
      previewUpdate?.changelog || updateData.changelog,
      ['preview-features']
    );
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'preview-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setDownloadModal(false);
  };

  const handleChangePin = async () => {
    if (!/^\d{4}$/.test(newPin) && !/^\d{8}$/.test(newPin)) {
      setError('PIN must be 4 or 8 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      await DeveloperService.changeDeveloperPin(newPin);
      DeveloperService.logAction('PIN_CHANGE', { status: 'success' });
      setPinModal(false);
      setNewPin('');
      setConfirmPin('');
      setError('');
    } catch (err) {
      DeveloperService.logAction('PIN_CHANGE', { status: 'failed', error: err.message });
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('makenna_developer_authenticated');
    window.location.href = '/';
  };

  const ChildRow = ({ child }) => (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-gray-700"
    >
      <td className="p-3">
        <input
          type="checkbox"
          checked={selectedChildren.includes(child.childId)}
          onChange={() => handleSelectChild(child.childId)}
          className="w-4 h-4"
        />
      </td>
      <td className="p-3 text-white font-mono">{child.childId}</td>
      <td className="p-3 text-white">{child.fullName}</td>
      <td className="p-3 text-gray-400">
        {new Date(child.createdAt).toLocaleDateString()}
      </td>
      <td className="p-3 text-gray-400">
        {child.progressSummary?.lettersMastered || 0} / {child.progressSummary?.numbersMastered || 0}
      </td>
      <td className="p-3">
        <div className="flex gap-2">
          <button
            onClick={() => DeveloperService.resetChildProgress(child.childId, 'all')}
            className="p-1 text-yellow-400 hover:text-yellow-300"
            title="Reset Progress"
          >
            <FaChartBar />
          </button>
          <button
            onClick={() => DeveloperService.resetChildProgress(child.childId, 'stars')}
            className="p-1 text-yellow-400 hover:text-yellow-300"
            title="Reset Stars"
          >
            <FaStar />
          </button>
          <button
            onClick={() => DeveloperService.deleteChild(child.childId)}
            className="p-1 text-red-400 hover:text-red-300"
            title="Delete"
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </motion.tr>
  );

  const PreviewChildRow = ({ child }) => (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-gray-700"
    >
      <td className="p-3">
        <input
          type="checkbox"
          checked={selectedPreviewChildren.includes(child.childId)}
          onChange={() => handleSelectPreviewChild(child.childId)}
          className="w-4 h-4"
        />
      </td>
      <td className="p-3 text-white font-mono">{child.childId}</td>
      <td className="p-3 text-white">{child.fullName}</td>
      <td className="p-3 text-gray-400">
        {new Date(child.createdAt).toLocaleDateString()}
      </td>
      <td className="p-3 text-gray-400">
        {child.progressSummary?.lettersMastered || 0} / {child.progressSummary?.numbersMastered || 0}
      </td>
      <td className="p-3">
        <span className="text-xs bg-gray-700 px-2 py-1 rounded">Ready for testing</span>
      </td>
    </motion.tr>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Developer Portal 🔧</h1>
          <p className="text-gray-400">System Management Dashboard</p>
        </div>
        <button
          onClick={() => setPinModal(true)}
          className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
          title="Change PIN"
        >
          <FaCog />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'children', label: 'Children', icon: FaUser },
          { id: 'trash', label: 'Trash', icon: FaTrash },
          { id: 'backup', label: 'Backup', icon: FaDatabase },
          { id: 'updates', label: 'Updates', icon: FaSync },
          { id: 'features', label: 'Features', icon: FaStar },
          { id: 'logs', label: 'Logs', icon: FaChartBar },
          { id: 'ai', label: 'AI Assistant', icon: FaRobot }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Updates Tab - Enhanced with Preview Workflow and GitHub Deploy */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-400">{updates.filter(u => u.status === 'preview').length}</p>
              <p className="text-sm text-gray-400">In Preview</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">{updates.filter(u => u.status === 'pending').length}</p>
              <p className="text-sm text-gray-400">Pending Release</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{updates.filter(u => u.status === 'active').length}</p>
              <p className="text-sm text-gray-400">Active</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-400">{updates.filter(u => u.status === 'rolled_back').length}</p>
              <p className="text-sm text-gray-400">Rolled Back</p>
            </div>
          </div>

          <button
            onClick={() => setUpdateModal(true)}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <FaRocket /> Create Update (Preview Mode)
          </button>

          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="font-bold mb-3">GitHub Deploy Workflow</h3>
            <div className="bg-gray-700 rounded-lg p-3 mb-4">
              <p className="text-sm mb-2">📝 <strong>Preview → Pending → Active → Deploy to GitHub</strong></p>
              <p className="text-xs text-gray-400">
                1. Create update and select test children<br/>
                2. Preview children see update on this device<br/>
                3. Click "Deploy Config" to download preview-config.json<br/>
                4. Save file to public/ folder and push to GitHub<br/>
                5. Vercel deploys automatically<br/>
                6. Preview children see update on ALL devices!
              </p>
            </div>
            
            <h3 className="font-bold mb-3">Update History ({updates.length})</h3>
            {updates.length === 0 ? (
              <p className="text-gray-400">No updates yet. Create your first update to get started!</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {updates.map(update => (
                  <div key={update.id} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">v{update.version} ({update.type})</p>
                        <p className="text-sm text-gray-400">{update.changelog}</p>
                        <p className="text-xs text-gray-500">
                          Target: {update.target} • {new Date(update.timestamp).toLocaleString()}
                        </p>
                        {update.previewChildren?.length > 0 && (
                          <p className="text-xs text-purple-300 mt-1">
                            Preview testers: {update.previewChildren.length} children
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {update.status === 'preview' && (
                          <>
                            <button
                              onClick={() => {
                                setPreviewUpdateId(update.id);
                                setPreviewModal(true);
                              }}
                              className="px-2 py-1 bg-blue-600 rounded text-xs"
                            >
                              👥 Select Testers
                            </button>
                            {update.previewChildren?.length > 0 && (
                              <button
                                onClick={() => {
                                  setPreviewUpdateId(update.id);
                                  setDownloadModal(true);
                                }}
                                className="px-2 py-1 bg-green-600 rounded text-xs flex items-center gap-1"
                              >
                                <FaDownload /> Deploy Config
                              </button>
                            )}
                            <button
                              onClick={() => handlePromoteUpdate(update.id)}
                              className="px-2 py-1 bg-indigo-600 rounded text-xs"
                            >
                              🚀 Promote
                            </button>
                          </>
                        )}
                        {update.status === 'pending' && (
                          <button
                            onClick={() => handleActivateUpdate(update.id)}
                            className="px-2 py-1 bg-green-600 rounded text-xs"
                          >
                            Activate
                          </button>
                        )}
                        {update.status === 'active' && (
                          <button
                            onClick={() => handleRollbackUpdate(update.id)}
                            className="px-2 py-1 bg-red-600 rounded text-xs"
                          >
                            Rollback
                          </button>
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          update.status === 'active' ? 'bg-green-600' :
                          update.status === 'pending' ? 'bg-blue-600' :
                          update.status === 'rolled_back' ? 'bg-red-600' : 'bg-purple-600'
                        }`}>
                          {update.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Children Tab */}
      {activeTab === 'children' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search children..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              onChange={(e) => handleBulkAction(e.target.value)}
              className="px-4 py-2 bg-gray-800 rounded-lg focus:outline-none"
              value=""
            >
              <option value="">Bulk Action</option>
              <option value="delete">Delete Selected</option>
              <option value="reset_progress">Reset Progress</option>
              <option value="reset_stars">Reset Stars</option>
            </select>
          </div>

          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedChildren.length === children.length && children.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="p-3 text-left text-sm">ID</th>
                  <th className="p-3 text-left text-sm">Name</th>
                  <th className="p-3 text-left text-sm">Created</th>
                  <th className="p-3 text-left text-sm">Progress</th>
                  <th className="p-3 text-left text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {children.map(child => (
                  <ChildRow key={child.childId} child={child} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Selection Modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Select Test Children for Preview</h3>
            <p className="text-sm text-gray-400 mb-4">
              Choose which children should test this preview update before it goes live.
              Preview access expires after 7 days.
            </p>
            
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedPreviewChildren.length === children.length && children.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="p-3 text-left text-sm">ID</th>
                    <th className="p-3 text-left text-sm">Name</th>
                    <th className="p-3 text-left text-sm">Created</th>
                    <th className="p-3 text-left text-sm">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {children.map(child => (
                    <PreviewChildRow key={child.childId} child={child} />
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAssignPreviewChildren}
                disabled={selectedPreviewChildren.length === 0}
                className="flex-1 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Assign {selectedPreviewChildren.length} Test Children
              </button>
              <button
                onClick={() => setPreviewModal(false)}
                className="flex-1 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Preview Config Modal */}
      {downloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Download Preview Config for GitHub Deploy</h3>
            <p className="text-sm text-gray-400 mb-4">
              This will download a <code>preview-config.json</code> file. Save it to your <code>public/</code> folder and push to GitHub for cross-device preview updates.
            </p>
            <div className="p-3 bg-gray-700 rounded-lg mb-4">
              <p className="text-xs text-gray-300">
                After saving, run:
                <br/><code className="text-green-400">git add public/preview-config.json</code>
                <br/><code className="text-green-400">git commit -m "Add preview update config"</code>
                <br/><code className="text-green-400">git push</code>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPreviewConfig}
                className="flex-1 py-2 bg-green-600 rounded hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <FaDownload /> Download Config
              </button>
              <button
                onClick={() => setDownloadModal(false)}
                className="flex-1 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Change Modal */}
      {pinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Change Developer PIN</h3>
            {error && <p className="text-red-400 mb-2">{error}</p>}
            <input
              type="password"
              placeholder="New PIN (4 or 8 digits)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="w-full px-4 py-2 mb-3 bg-gray-700 rounded"
            />
            <input
              type="password"
              placeholder="Confirm PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="w-full px-4 py-2 mb-4 bg-gray-700 rounded"
            />
            <div className="flex gap-2">
              <button
                onClick={handleChangePin}
                className="flex-1 py-2 bg-purple-600 rounded hover:bg-purple-700"
              >
                Save
              </button>
              <button
                onClick={() => setPinModal(false)}
                className="flex-1 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {updateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create Update (Preview Mode)</h3>
            {error && <p className="text-red-400 mb-2">{error}</p>}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Version (e.g., 1.0.1)"
                value={updateData.version}
                onChange={(e) => setUpdateData({...updateData, version: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 rounded"
              />
              <select
                value={updateData.type}
                onChange={(e) => setUpdateData({...updateData, type: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 rounded"
              >
                <option value="feature">Feature</option>
                <option value="bugfix">Bug Fix</option>
                <option value="security">Security</option>
                <option value="content">Content</option>
              </select>
              <textarea
                placeholder="Changelog / Release Notes"
                value={updateData.changelog || ''}
                onChange={(e) => setUpdateData({...updateData, changelog: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 rounded h-24"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateUpdate}
                className="flex-1 py-2 bg-purple-600 rounded hover:bg-purple-700"
              >
                Create Preview Update
              </button>
              <button
                onClick={() => setUpdateModal(false)}
                className="flex-1 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="fixed bottom-4 right-4 p-3 bg-red-600 rounded-full hover:bg-red-700"
        title="Logout"
      >
        <FaSignOutAlt />
      </button>
    </div>
  );
};

export default DeveloperDashboard;