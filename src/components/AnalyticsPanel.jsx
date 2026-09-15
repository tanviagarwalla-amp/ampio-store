/**
 * In-app Amplitude inspector.
 *
 * Two jobs:
 *  1. Paste / store a project API key at runtime so the demo can be pointed at
 *     any Amplitude project without a rebuild.
 *  2. Show the live event stream (name + properties) so you can verify the
 *     tracking plan while clicking through the store.
 */

import { useEffect, useState } from 'react';
import {
  analyticsStatus,
  clearLog,
  initAnalytics,
  replayPreference,
  saveApiKey,
  saveReplayPreference,
  storedApiKey,
  subscribeToLog,
} from '../lib/analytics';
import { clock } from '../lib/format';
import { SparkIcon } from './Icons';

export default function AnalyticsPanel() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [keyDraft, setKeyDraft] = useState(storedApiKey());
  const [status, setStatus] = useState(analyticsStatus());
  const [replay, setReplay] = useState(replayPreference());

  useEffect(() => subscribeToLog(setEntries), []);
  useEffect(() => {
    const t = setInterval(() => setStatus(analyticsStatus()), 1500);
    return () => clearInterval(t);
  }, []);

  const connect = async () => {
    saveApiKey(keyDraft);
    saveReplayPreference(replay);
    const ok = await initAnalytics();
    setStatus(analyticsStatus());
    if (ok && !status.initialized) window.location.reload();
  };

  const eventCount = entries.filter((e) => e.type === 'event').length;

  if (!open) {
    return (
      <button type="button" className="amp-fab" onClick={() => setOpen(true)}>
        <span className={`live ${status.initialized ? '' : 'off'}`} />
        Amplitude · {eventCount}
      </button>
    );
  }

  return (
    <aside className="amp-panel" aria-label="Amplitude event inspector">
      <header>
        <h3>
          <SparkIcon width="13" height="13" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
          Amplitude inspector
        </h3>
        <div style={{ display: 'flex', gap: 2 }}>
          <button type="button" onClick={clearLog}>
            Clear
          </button>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </header>

      <div className="amp-key">
        {status.keySource === 'env' ? (
          <div className="status">
            Key loaded from <code>VITE_AMPLITUDE_API_KEY</code> · sending as <code>{status.apiKey}</code>
          </div>
        ) : (
          <>
            <label className="status" htmlFor="amp-key-input">
              Paste an Amplitude project API key to start sending events from this browser:
            </label>
            <input
              id="amp-key-input"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="e.g. 1a2b3c4d5e6f7a8b9c0d…"
              spellCheck="false"
            />
            <div className="row">
              <button type="button" className="go" onClick={connect}>
                {status.initialized ? 'Reconnect' : 'Connect'}
              </button>
              <button
                type="button"
                onClick={() => {
                  saveApiKey('');
                  setKeyDraft('');
                  window.location.reload();
                }}
              >
                Forget key
              </button>
              <label className="status" style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                <input
                  type="checkbox"
                  checked={replay}
                  onChange={(e) => {
                    setReplay(e.target.checked);
                    saveReplayPreference(e.target.checked);
                  }}
                  style={{ width: 'auto' }}
                />
                Session Replay
              </label>
            </div>
          </>
        )}
        <div className="status">
          {status.initialized ? (
            <>
              Connected · {status.apiKey} · Session Replay {status.sessionReplay ? 'on' : 'off'}
            </>
          ) : (
            <>Not connected — events below are captured locally but not sent.</>
          )}
        </div>
      </div>

      <div className="amp-log">
        {entries.length === 0 && <div className="amp-empty">Interact with the store to see events.</div>}
        {entries.map((e) => (
          <div className="amp-entry" key={e.id}>
            <div className="top">
              <span className={`tag ${e.type}`}>{e.type}</span>
              <span className="name">{e.name}</span>
              <span className="at">{clock(e.at)}</span>
            </div>
            {e.payload && Object.keys(e.payload).length > 0 && (
              <pre>{JSON.stringify(e.payload, null, 1)}</pre>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
