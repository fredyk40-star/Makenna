import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DeveloperService } from '../../services/DeveloperService';
import { UpdateService } from '../../services/UpdateService';
import { ChildAccountService } from '../../services/ChildAccountService';
import { SupportService } from '../../services/SupportService';
import { FaUser, FaTrash, FaUndo, FaDownload, FaStar, FaChartBar, FaDatabase, FaCog, FaSignOutAlt, FaSync, FaRocket, FaRobot, FaPlus, FaEnvelope, FaKey, FaCheck } from 'react-icons/fa';
import appMetadata from '../../../package.json';

const DeveloperDashboard = () => {
  const [children, setChildren] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [selectedPreviewChildren, setSelectedPreviewChildren] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [backups, setBackups] = useState([]);
  const [featureFlags, setFeatureFlags] = useState({});
  const [updates, setUpdates] = useState([]);
  const [trashBin, setTrashBin] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logFilters, setLogFilters] = useState({ action: '', startDate: '', endDate: '' });
  const [selectedLogAction, setSelectedLogAction] = useState('');
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
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

  // Cloud sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSync, setLastSync] = useState(DeveloperService.getLastSyncTime());
  const [cloudHealth, setCloudHealth] = useState({ status: 'checking', checkedAt: null });
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [overviewAIInteractions, setOverviewAIInteractions] = useState(0);
  const [backupPreview, setBackupPreview] = useState(null);

  // Support inbox state
  const [supportRequests, setSupportRequests] = useState([]);
  const [supportSyncing, setSupportSyncing] = useState(false);
  const [tempRequest, setTempRequest] = useState(null);
  const [tempPasswordResult, setTempPasswordResult] = useState('');
  const [tempSending, setTempSending] = useState(false);

  useEffect(() => {
    loadChildren();
    loadBackups();
    setFeatureFlags(DeveloperService.getFeatureFlags());
    setUpdates(UpdateService.getUpdateHistory());
    // Auto-sync from cloud on mount
    handleCloudSync(true);
    syncFeatures();
    syncUpdates();
  }, []);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      setOverviewAIInteractions(DeveloperService.getAIStatistics().totalInteractions || 0);
    }
  }, [activeTab, aiStatistics]);

  const syncFeatures = async () => {
    const result = await DeveloperService.syncFeaturesFromCloud();
    if (result.success) setFeatureFlags(result.flags);
  };

  const syncUpdates = async () => {
    const result = await DeveloperService.syncUpdatesFromCloud();
    if (result.success) setUpdates(result.updates);
  };

  const handleCloudSync = async (silent = false) => {
    if (syncing) return;
    setSyncing(true);
    setCloudHealth({ status: 'checking', checkedAt: null });
    if (!silent) setSyncMessage('Syncing from cloud...');
    try {
      const result = await DeveloperService.syncChildrenFromCloud();
      if (result.success) {
        const checkedAt = new Date().toISOString();
        setCloudHealth({ status: 'healthy', checkedAt });
        setSyncMessage(`Synced ${result.count} accounts`);
        DeveloperService.setLastSyncTime(checkedAt);
        setLastSync(checkedAt);
        loadChildren();
      } else {
        setCloudHealth({ status: 'error', checkedAt: new Date().toISOString() });
        setSyncMessage(result.error || 'Sync failed');
      }
    } catch (err) {
      setCloudHealth({ status: 'error', checkedAt: new Date().toISOString() });
      setSyncMessage('Sync error: ' + err.message);
    } finally {
      setSyncing(false);
      if (!silent) setTimeout(() => setSyncMessage(''), 5000);
    }
  };

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

  useEffect(() => {
    if (activeTab === 'support') {
      loadSupportRequests();
    }
  }, [activeTab]);

  const loadAIData = () => {
    setAiConfig(DeveloperService.getAIConfig());
    setAiVoiceCommands(DeveloperService.getAIVoiceCommands());
    setAiStatistics(DeveloperService.getAIStatistics());
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

  const loadSupportRequests = async () => {
    setSupportRequests(SupportService.getRequests());
    setSupportSyncing(true);
    try {
      // Identity checks now happen on the server, so no local account pull is
      // required before reviewing requests on another device.
      const result = await SupportService.syncFromCloud();
      if (result.success) setSupportRequests(result.requests);
    } finally {
      setSupportSyncing(false);
    }
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

  const handleCreateUpdate = async () => {
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
    // Sync updates to cloud
    await DeveloperService._syncUpdatesToCloud();
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

  const handlePromoteUpdate = async (updateId) => {
    if (window.confirm('Promote this preview update to pending? It will be ready for staged rollout.')) {
      UpdateService.promoteUpdate(updateId);
      setUpdates(UpdateService.getUpdateHistory());
      DeveloperService.logAction('UPDATE_PROMOTE', { updateId });
      await DeveloperService._syncUpdatesToCloud();
    }
  };

  const handleActivateUpdate = async (updateId) => {
    UpdateService.activateUpdate(updateId);
    setUpdates(UpdateService.getUpdateHistory());
    await DeveloperService._syncUpdatesToCloud();
  };

  const handleRollbackUpdate = async (updateId) => {
    if (window.confirm('Rollback this update?')) {
      UpdateService.rollbackUpdate(updateId);
      setUpdates(UpdateService.getUpdateHistory());
      await DeveloperService._syncUpdatesToCloud();
    }
  };

  const handleCreateBackup = () => {
    DeveloperService.createBackup();
    DeveloperService.logAction('BACKUP', { count: backups.length + 1 });
    loadBackups();
  };

  const handleRestoreBackup = () => {
    if (!backupPreview) return;
    const childCount = Array.isArray(backupPreview.data?.childAccounts)
      ? backupPreview.data.childAccounts.length
      : 0;
    const trashCount = Array.isArray(backupPreview.data?.trashBin)
      ? backupPreview.data.trashBin.length
      : 0;
    const currentChildCount = ChildAccountService.getAllAccounts().length;
    if (!window.confirm(
      `Restore this backup from ${new Date(backupPreview.timestamp).toLocaleString()}? ` +
      `It will replace ${currentChildCount} current child accounts with ${childCount} child accounts and ${trashCount} deleted accounts.`,
    )) return;

    try {
      const restored = DeveloperService.restoreBackup(backupPreview.timestamp);
      if (!restored) {
        throw new Error('This backup is invalid, missing, or could not be saved. Current data was kept when possible.');
      }
      DeveloperService.logAction('RESTORE_BACKUP', {
        timestamp: backupPreview.timestamp,
        childCount,
        trashCount,
      });
      setBackupPreview(null);
      loadChildren();
      loadTrashBin();
    } catch (err) {
      setError(err.message || 'The backup could not be restored.');
    }
  };

  const handleToggleFeature = async (key) => {
    const newValue = !featureFlags[key];
    const newFlags = { ...featureFlags, [key]: newValue };
    setFeatureFlags(newFlags);
    DeveloperService.updateFeatureFlags(newFlags);
    DeveloperService.logAction('FEATURE_TOGGLE', { feature: key, newState: newValue ? 'enabled' : 'disabled' });
    // Sync feature flags to cloud
    await DeveloperService._syncFeaturesToCloud();
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

  const handleRequestPasswordReset = async () => {
    setError('');
    try {
      await DeveloperService.requestPasswordReset(DeveloperService.getDeveloperEmail());
      setPasswordResetSent(true);
      DeveloperService.logAction('DEV_PASSWORD_RESET_REQUESTED', { status: 'sent' });
    } catch (err) {
      DeveloperService.logAction('DEV_PASSWORD_RESET_REQUESTED', { status: 'failed', error: err.message });
      setError(err.message);
    }
  };

  const handleSupportStatus = async (request, status) => {
    try {
      const updated = await SupportService.markStatus(request.id, status);
      setSupportRequests(SupportService.getRequests());
      DeveloperService.logAction('SUPPORT_REQUEST_UPDATED', { id: request.id, status: updated.status });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendTempPassword = async () => {
    if (!tempRequest) return;
    setTempSending(true);
    setError('');
    try {
      const credential = await ChildAccountService.issueTemporaryPassword(
        tempRequest.childId,
        tempRequest.parentEmail,
        DeveloperService.getSessionToken()
      );
      const result = await DeveloperService.sendTemporaryPassword(credential);
      setTempPasswordResult(result?.success ? '' : credential.tempPassword);
      await SupportService.markStatus(tempRequest.id, 'reviewing', 'One-time password issued.');
      loadSupportRequests();
      DeveloperService.logAction('TEMP_PASSWORD_SENT', { childId: credential.childId, success: true });
      if (!result?.success) {
        setError(result?.error || 'Email is not configured. Copy the one-time password below.');
      }
    } catch (err) {
      DeveloperService.logAction('TEMP_PASSWORD_SENT', { status: 'failed', error: err.message });
      setError(err.message);
    } finally {
      setTempSending(false);
    }
  };

  const handleLogout = () => {
    DeveloperService.clearSession();
    window.location.href = '/';
  };

  const ChildRow = ({ child }) => {
  const handleRowDelete = async () => {
      if (window.confirm(`Delete ${child.fullName}?`)) {
        await DeveloperService.deleteChild(child.childId);
        DeveloperService.logAction('DELETE', { childId: child.childId });
        loadChildren();
        loadTrashBin();
      }
    };

    const handleRowResetProgress = () => {
      if (window.confirm(`Reset all progress for ${child.fullName}?`)) {
        DeveloperService.resetChildProgress(child.childId, 'all');
        DeveloperService.logAction('RESET_PROGRESS', { childId: child.childId });
        loadChildren();
      }
    };

    const handleRowResetStars = () => {
      if (window.confirm(`Reset stars for ${child.fullName}?`)) {
        DeveloperService.resetChildProgress(child.childId, 'stars');
        DeveloperService.logAction('RESET_STARS', { childId: child.childId });
        loadChildren();
      }
    };

    return (
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
              onClick={handleRowResetProgress}
              className="p-1 text-yellow-400 hover:text-yellow-300"
              title="Reset Progress"
            >
              <FaChartBar />
            </button>
            <button
              onClick={handleRowResetStars}
              className="p-1 text-yellow-400 hover:text-yellow-300"
              title="Reset Stars"
            >
              <FaStar />
            </button>
            <button
              onClick={handleRowDelete}
              className="p-1 text-red-400 hover:text-red-300"
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        </td>
      </motion.tr>
    );
  };

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

  const cloudStatus = isOnline ? cloudHealth.status : 'offline';
  const cloudStatusLabel = {
    checking: 'Checking',
    healthy: 'Connected',
    error: 'Unavailable',
    offline: 'Offline',
  }[cloudStatus] || 'Unknown';
  const cloudStatusColor = {
    checking: 'text-yellow-400',
    healthy: 'text-green-400',
    error: 'text-red-400',
    offline: 'text-red-400',
  }[cloudStatus] || 'text-gray-400';
  const activeReleaseCount = updates.filter(update => update.status === 'active').length;
  const pendingReleaseCount = updates.filter(update => update.status === 'pending').length;
  const openSupportCount = SupportService.getOpenCount();
  const enabledFeatureCount = Object.values(featureFlags).filter(Boolean).length;
  const previewBackupChildCount = Array.isArray(backupPreview?.data?.childAccounts)
    ? backupPreview.data.childAccounts.length
    : null;
  const previewBackupTrashCount = Array.isArray(backupPreview?.data?.trashBin)
    ? backupPreview.data.trashBin.length
    : null;
  const previewBackupDate = backupPreview ? new Date(backupPreview.timestamp) : null;
  const previewBackupIsValid = previewBackupChildCount !== null &&
    previewBackupTrashCount !== null &&
    Number.isFinite(previewBackupDate?.getTime());
  const currentChildAccountCount = ChildAccountService.getAllAccounts().length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Developer Portal 🔧</h1>
          <p className="text-gray-400">System Management Dashboard</p>
        </div>
        <button
          onClick={() => { setPasswordModal(true); setPasswordResetSent(false); setError(''); }}
          className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
          title="Reset developer password"
        >
          <FaCog />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: FaChartBar },
          { id: 'children', label: 'Children', icon: FaUser },
          { id: 'support', label: 'Support', icon: FaEnvelope },
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

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <section aria-label="Privacy-safe usage summary">
            <h2 className="font-bold text-lg mb-3">Usage Summary</h2>
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
              {[
                { label: 'Child accounts', value: children.length, color: 'text-cyan-300' },
                { label: 'Cached open support requests', value: openSupportCount, color: 'text-yellow-300' },
                { label: 'Local backups', value: backups.length, color: 'text-blue-300' },
                { label: 'Enabled features', value: enabledFeatureCount, color: 'text-green-300' },
                { label: 'AI interactions', value: overviewAIInteractions, color: 'text-purple-300' },
              ].map(metric => (
                <div key={metric.label} className="bg-gray-800 rounded-xl p-4">
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="text-sm text-gray-400">{metric.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Counts only; no child names, identifiers, or individual learning details are shown here.
              Support count reflects requests cached on this device.
            </p>
          </section>

          <div className="grid lg:grid-cols-2 gap-4">
            <section className="bg-gray-800 rounded-xl p-5" aria-label="System health">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-bold text-lg">System Health</h2>
                <span className="text-xs text-gray-500">Live network + last sync</span>
              </div>
              <dl className="space-y-3">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Network</dt>
                  <dd className={isOnline ? 'text-green-400' : 'text-red-400'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Cloud sync API</dt>
                  <dd className={cloudStatusColor}>{cloudStatusLabel}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Last successful sync</dt>
                  <dd className="text-right text-gray-200">
                    {lastSync ? new Date(lastSync).toLocaleString() : 'Not recorded'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Last health check</dt>
                  <dd className="text-right text-gray-200">
                    {cloudHealth.checkedAt ? new Date(cloudHealth.checkedAt).toLocaleString() : 'Checking...'}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-gray-500 mt-4">
                Cloud status updates from the dashboard's existing authenticated sync. No extra health or third-party API calls are made; database credentials and connection details are not exposed.
              </p>
            </section>

            <section className="bg-gray-800 rounded-xl p-5" aria-label="Release status">
              <h2 className="font-bold text-lg mb-4">Release Status</h2>
              <p className="text-gray-400">Current app build</p>
              <p className="text-2xl font-bold text-cyan-300">v{appMetadata.version}</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xl font-bold text-green-300">{activeReleaseCount}</p>
                  <p className="text-sm text-gray-400">Active rollouts</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xl font-bold text-yellow-300">{pendingReleaseCount}</p>
                  <p className="text-sm text-gray-400">Pending releases</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('updates')}
                className="mt-4 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Manage Releases
              </button>
            </section>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setActiveTab('children')} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
              Manage Children
            </button>
            <button type="button" onClick={() => setActiveTab('support')} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
              Open Support Inbox
            </button>
            <button type="button" onClick={() => setActiveTab('backup')} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
              Review Backups
            </button>
          </div>
        </div>
      )}

      {/* Support Tab */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-bold text-lg">Support Messages ({supportRequests.length})</h3>
            <span className="text-sm text-yellow-400">
              {SupportService.getOpenCount()} open
            </span>
            <button
              onClick={loadSupportRequests}
              disabled={supportSyncing}
              className="px-3 py-1 bg-blue-600 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <FaSync className={supportSyncing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {supportRequests.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-400">
              No support requests yet. Parent messages will appear here for review.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {supportRequests.map(request => (
                  <div key={request.id} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          <FaEnvelope className="text-purple-400" />
                          {request.childId}
                          <span className={`px-2 py-1 rounded text-xs ${
                            request.status === 'open' ? 'bg-yellow-600' :
                              request.status === 'reviewing' ? 'bg-blue-600' : 'bg-green-600'
                          }`}>
                            {request.status}
                          </span>
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <FaCheck /> ID + email verified by server
                          </span>
                        </p>
                        <p className="text-sm text-gray-400">
                          {request.fullName || 'Child'} • {request.parentEmail}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleSupportStatus(request, 'reviewing')}
                          className="px-2 py-1 bg-blue-600 rounded text-xs"
                        >
                          Mark Reviewing
                        </button>
                        <button
                          onClick={() => handleSupportStatus(request, 'resolved')}
                          className="px-2 py-1 bg-green-600 rounded text-xs"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => { setTempRequest(request); setTempPasswordResult(''); setError(''); }}
                          className="px-2 py-1 bg-purple-600 rounded text-xs flex items-center gap-1"
                          title="Send a one-time password"
                        >
                          <FaKey /> Send Temp Password
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-300 bg-gray-700 rounded-lg p-3">
                      {request.message}
                    </p>
                    {request.developerNote && (
                      <p className="mt-2 text-xs text-purple-300">Note: {request.developerNote}</p>
                    )}
                  </div>
              ))}
            </div>
          )}
        </div>
      )}

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
          {/* Sync bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleCloudSync(false)}
              disabled={syncing}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                syncing ? 'bg-gray-600 text-gray-300 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <FaSync className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync from Cloud'}
            </button>
            <span className="text-sm text-gray-400">
              {children.length} child{children.length !== 1 ? 'ren' : ''} loaded
            </span>
            {lastSync && (
              <span className="text-xs text-gray-500">
                Last sync: {new Date(lastSync).toLocaleString()}
              </span>
            )}
            {syncMessage && (
              <span className={`text-sm ${syncMessage.includes('error') || syncMessage.includes('fail') || syncMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {syncMessage}
              </span>
            )}
          </div>

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

          <div className="bg-gray-800 rounded-xl overflow-hidden overflow-x-auto">
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

      {/* Trash Tab */}
      {activeTab === 'trash' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg">Deleted Accounts ({trashBin.length})</h3>
            {trashBin.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Permanently delete ALL trash items?')) {
                    DeveloperService.emptyTrashBin();
                    loadTrashBin();
                  }
                }}
                className="px-3 py-1 bg-red-600 rounded text-xs hover:bg-red-700"
              >
                Empty Trash
              </button>
            )}
          </div>
          {trashBin.length === 0 ? (
            <p className="text-gray-400 p-4">Trash is empty.</p>
          ) : (
            <div className="bg-gray-800 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-3 text-left text-sm">ID</th>
                    <th className="p-3 text-left text-sm">Name</th>
                    <th className="p-3 text-left text-sm">Deleted</th>
                    <th className="p-3 text-left text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashBin.map(item => (
                    <tr key={item.childId} className="border-b border-gray-700">
                      <td className="p-3 text-white font-mono text-sm">{item.childId}</td>
                      <td className="p-3 text-white">{item.fullName}</td>
                      <td className="p-3 text-gray-400 text-sm">
                        {new Date(item.deletedAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              await DeveloperService.restoreChild(item.childId);
                              loadChildren();
                              loadTrashBin();
                            }}
                            className="px-2 py-1 bg-green-600 rounded text-xs hover:bg-green-700"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Permanently delete?')) {
                                DeveloperService.deletePermanently(item.childId);
                                loadTrashBin();
                              }
                            }}
                            className="px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-700"
                          >
                            Delete Forever
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg">Backups ({backups.length})</h3>
            <button
              onClick={handleCreateBackup}
              className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <FaPlus /> Create Backup
            </button>
          </div>
          {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
          {backupPreview && (
            <section className="bg-blue-950/60 border border-blue-700 rounded-xl p-4" aria-label="Backup restore preview">
              <h4 className="font-bold text-lg">Restore Preview</h4>
              <p className="text-sm text-gray-300 mt-1">
                Backup from {previewBackupDate && Number.isFinite(previewBackupDate.getTime())
                  ? previewBackupDate.toLocaleString()
                  : 'an unknown date'}
              </p>
              {previewBackupIsValid ? (
                <ul className="text-sm text-gray-300 mt-3 space-y-1">
                  <li>Child accounts to restore: {previewBackupChildCount}</li>
                  <li>Deleted accounts in backup: {previewBackupTrashCount}</li>
                  <li>Current child accounts to be replaced: {currentChildAccountCount}</li>
                </ul>
              ) : (
                <p className="text-red-300 text-sm mt-3">
                  This backup is incomplete and cannot be restored.
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleRestoreBackup}
                  disabled={!previewBackupIsValid}
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Restore This Backup
                </button>
                <button
                  type="button"
                  onClick={() => setBackupPreview(null)}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-yellow-300 mt-3">
                Restoring replaces the current local child-account and trash data. You’ll be asked to confirm before anything changes.
              </p>
            </section>
          )}
          {backups.length === 0 ? (
            <p className="text-gray-400 p-4">No backups yet. Create one to protect your data.</p>
          ) : (
            <div className="space-y-2">
              {backups.map((backup, idx) => (
                <div key={idx} className="p-4 bg-gray-800 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">Backup #{backups.length - idx}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(backup.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => { setError(''); setBackupPreview(backup); }}
                    className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
                  >
                    <FaUndo className="inline mr-1" /> Preview Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Feature Flags</h3>
          <div className="space-y-2">
            {Object.entries(featureFlags).map(([key, value]) => (
              <div key={key} className="p-4 bg-gray-800 rounded-lg flex justify-between items-center">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <button
                  onClick={() => handleToggleFeature(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    value ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {value ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button onClick={applyLogFilters} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
              Apply Filters
            </button>
            <button onClick={clearLogFilters} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700">
              Clear Filters
            </button>
            <span className="text-sm text-gray-400 self-center">{logs.length} log entries</span>
          </div>
          <div className="bg-gray-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-sm">Time</th>
                  <th className="p-3 text-left text-sm">Action</th>
                  <th className="p-3 text-left text-sm">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 100).map(log => (
                  <tr key={log.id} className="border-b border-gray-700">
                    <td className="p-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 text-white text-sm font-mono">{log.action}</td>
                    <td className="p-3 text-gray-400 text-xs">
                      {JSON.stringify(log.details).substring(0, 80)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Assistant Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">AI Assistant Management</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-400">{aiStatistics.totalInteractions || 0}</p>
              <p className="text-sm text-gray-400">Total Interactions</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{aiVoiceCommands.length}</p>
              <p className="text-sm text-gray-400">Voice Commands</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">
                {aiConfig.interactiveMode ? 'ON' : 'OFF'}
              </p>
              <p className="text-sm text-gray-400">Interactive Mode</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAiCommandModal(true)}
              className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              <FaPlus className="inline mr-1" /> Add Command
            </button>
            <button
              onClick={handleClearAIInteractions}
              className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
            >
              Clear History
            </button>
          </div>
          {/* Voice Commands List */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="font-bold mb-3">Voice Commands</h4>
            {aiVoiceCommands.length === 0 ? (
              <p className="text-gray-400">No custom voice commands.</p>
            ) : (
              <div className="space-y-2">
                {aiVoiceCommands.map(cmd => (
                  <div key={cmd.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{cmd.phrase}</p>
                      <p className="text-sm text-gray-400">{cmd.response}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAICommand(cmd.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* AI Config */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="font-bold mb-3">Configuration</h4>
            <div className="space-y-2">
              {Object.entries(aiConfig).filter(([k]) => k !== 'voiceSettings' && k !== 'messageCategories').map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-sm text-gray-400">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
          {/* AI Command Modal */}
          {aiCommandModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Add Voice Command</h3>
                <input
                  type="text"
                  placeholder="Phrase (e.g., 'help me')"
                  value={newCommand.phrase}
                  onChange={(e) => setNewCommand({ ...newCommand, phrase: e.target.value })}
                  className="w-full px-4 py-2 mb-3 bg-gray-700 rounded"
                />
                <input
                  type="text"
                  placeholder="Response"
                  value={newCommand.response}
                  onChange={(e) => setNewCommand({ ...newCommand, response: e.target.value })}
                  className="w-full px-4 py-2 mb-3 bg-gray-700 rounded"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddAICommand} className="flex-1 py-2 bg-purple-600 rounded hover:bg-purple-700">
                    Add
                  </button>
                  <button onClick={() => setAiCommandModal(false)} className="flex-1 py-2 bg-gray-600 rounded hover:bg-gray-700">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Selection Modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Select Test Children for Preview</h3>
            <p className="text-sm text-gray-400 mb-4">
              Choose which children should test this preview update before it goes live.
              Preview access expires after 7 days.
            </p>

            <div className="max-h-96 overflow-auto">
              <table className="w-full min-w-[36rem]">
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

      {/* Developer Password Reset Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2">Developer Password</h3>
            <p className="text-sm text-gray-400 mb-4">
              A reset link will only be sent to {DeveloperService.getDeveloperEmail()}.
            </p>
            {error && <p className="text-red-400 mb-2 text-sm">{error}</p>}
            {passwordResetSent && (
              <p className="text-green-400 mb-2 text-sm">Reset link sent. Check your inbox.</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleRequestPasswordReset}
                className="flex-1 py-2 bg-purple-600 rounded hover:bg-purple-700"
              >
                Email Reset Link
              </button>
              <button
                onClick={() => setPasswordModal(false)}
                className="flex-1 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Password Modal */}
      {tempRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-2">Send One-Time Password</h3>
            <p className="text-sm text-gray-400 mb-4">
              {tempRequest.childId} • {tempRequest.parentEmail}
            </p>
            {error && <p className="text-red-400 mb-2 text-sm">{error}</p>}
            {tempPasswordResult ? (
              <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-200 mb-2">
                  Email was not configured. Copy this one-time password and give it to the parent:
                </p>
                <code className="block text-lg font-mono text-white break-all">{tempPasswordResult}</code>
              </div>
            ) : (
              <p className="text-sm text-gray-300 mb-4">
                A random password will be saved to the account and emailed to the parent. It expires in 30 minutes.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSendTempPassword}
                disabled={tempSending}
                className="flex-1 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {tempSending ? 'Sending...' : 'Generate & Send'}
              </button>
              <button
                onClick={() => { setTempRequest(null); setTempPasswordResult(''); }}
                className="flex-1 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Close
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