import React, { useState, useEffect } from 'react';
import './App.css';
import config from './config';

function App() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
    
    // Check for callback parameters
    const params = new URLSearchParams(window.location.search);
    if (params.has('accessToken')) {
      const userData = {
        accessToken: params.get('accessToken'),
        refreshToken: params.get('refreshToken'),
        userId: params.get('userId'),
        displayName: params.get('displayName'),
      };
      setUser(userData);
      // Set success message
      setSuccessMessage("You're logged in with Spotify successfully. Your data is safe with us.");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isDarkMode]);

  // Optional: Clear success message after a few seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/login`);
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      setError('Failed to initiate Spotify login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please login with Spotify first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgressUpdates([]);

    try {
      if (!playlistUrl.trim() || !playlistName.trim()) {
        throw new Error('Please enter a playlist URL and name');
      }

      // Initial progress updates
      setProgressUpdates([
        'Fetching YouTube playlist...'
      ]);

      const response = await fetch(`${config.apiUrl}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: playlistUrl,
          name: playlistName,
          accessToken: user.accessToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert playlist');
      }

      const data = await response.json();

      // Update progress with track information
      setProgressUpdates(prev => [
        ...prev,
        `Total tracks found: ${data.summary.total}`,
        'Matching tracks with Spotify...'
      ]);

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update progress with matching information
      setProgressUpdates(prev => [
        ...prev,
        `Successfully matched: ${data.summary.matched} tracks`,
        'Creating Spotify playlist...'
      ]);

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Final progress update
      setProgressUpdates(prev => [
        ...prev,
        'Conversion completed successfully!'
      ]);

      // Set the final result
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setProgressUpdates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <header className="App-header">
        <div className="brand">
          <div className="brand-container">
            <span className="brand-text">tunePorter</span>
            <span className="version">v1.0</span>
          </div>
        </div>
        <div className="theme-toggle">
          {user && (
            <div className="user-welcome-box">
              <span className="user-welcome-box-text">Welcome, {user.displayName || 'User'}</span>
            </div>
          )}
          <button 
            onClick={toggleTheme} 
            className={`icon-button ${isDarkMode ? 'dark-mode' : ''}`}
          >
            <span className="icon-button-icon">
              {isDarkMode ? '🌙' : '☀️'}
            </span>
          </button>
        </div>
      </header>
      
      {successMessage && (
        <div className="spotify-success-message">
          {successMessage}
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <main>
        {!user && (
          <div className="validation-message-container">
            <div className="validation-message">
              <div className="validation-message-text">
                Please login with your Spotify account to start converting playlists. We have implemented secure login in process and it is required for playlist creation.
              </div>
              <div className="validation-message-action">
                <button onClick={handleLogin} className="login-button login-in-message">
                  Login with Spotify
                </button>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="converter-form">
          <div className="input-group">
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="Enter YouTube playlist URL"
              className="playlist-input"
              disabled={!user}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
              className="playlist-input"
              disabled={!user}
              required
            />
          </div>
          <div className="input-group">
            <button
              type="submit"
              className="convert-button"
              disabled={!user || isLoading || !playlistName.trim() || !playlistUrl.trim()}
            >
              {isLoading ? 'Converting...' : 'Convert'}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
          {progressUpdates.length > 0 && (
            <div className="progress-updates">
              {progressUpdates.map((update, index) => (
                <p key={index}>{update}</p>
              ))}
            </div>
          )}
          {result && (
            <div className="result-container">
              <p>Successfully converted {result.summary.matched} out of {result.summary.total} songs</p>
              <a href={result.playlistUrl} 
                 className="result-link" 
                 target="_blank" 
                 rel="noopener noreferrer">
                Open in {result.platform === 'spotify' ? 'Spotify' : 'YouTube'}
              </a>

              <div className="songs-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>YouTube Title</th>
                      <th>YouTube Artist</th>
                      <th>Status</th>
                      <th>Spotify Title</th>
                      <th>Spotify Artist</th>
                      <th>Match Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tracks.map((track, index) => (
                      <tr key={index} className={track.matched ? 'matched' : 'unmatched'}>
                        <td>{index + 1}</td>
                        <td>{track.youtube.title}</td>
                        <td>{track.youtube.artist}</td>
                        <td>
                          <span className={`status-badge ${track.matched ? 'success' : 'error'}`}>
                            {track.matched ? 'Found' : 'Not Found'}
                          </span>
                        </td>
                        <td>{track.matched ? track.spotify.title : '-'}</td>
                        <td>{track.matched ? track.spotify.artist : '-'}</td>
                        <td>
                          {track.matched ? 
                            <span className="match-score">
                              {(track.spotify.matchScore * 100).toFixed(1)}%
                            </span>
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </form>
      </main>
      <footer className="footer">
        <p>Made with ❤️ by Abhishek Sharma</p>
        <p>
        <strong>Please Note:</strong> Due to a Spotify policy change (May 15, 2025), new API access is only granted to organizations. As this is an individual project, it operates in a restricted mode, and login is limited to pre-authorized users only.
        </p>
  
      </footer>
    </div>
  );
}

export default App;
