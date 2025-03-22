import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiData, setApiData] = useState<string | null>(null)
  const [tokens, setTokens] = useState<string[]>([])
  const [decodedTokens, setDecodedTokens] = useState<any[]>([])
  const [useProxy, setUseProxy] = useState(true)
  const [showManualSteps, setShowManualSteps] = useState(false)
  const [rawHtml, setRawHtml] = useState<string | null>(null)
  const [showMode, setShowMode] = useState<'parsed' | 'raw'>('parsed')

  // Function to decode JWT token
  const decodeJWT = (token: string) => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }
      
      // Base64 decode and parse the payload (second part)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      return payload
    } catch (e) {
      console.error('Error decoding JWT:', e)
      return null
    }
  }

  const processTokens = (tokenArray: string[]) => {
    setTokens(tokenArray)
    
    // Decode each token
    const decoded = tokenArray.map(token => decodeJWT(token))
    setDecodedTokens(decoded.filter(Boolean)) // Remove null values
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setApiData(null)
    setRawHtml(null)
    setTokens([])
    setDecodedTokens([])
    
    try {
      // Choose between proxy or direct approach
      if (useProxy) {
        try {
          await loginWithProxy()
        } catch (err) {
          console.log('Login process failed, trying to fetch API data directly...')
          // If login fails, try to directly fetch the API data
          // This could happen if the user is already logged in
          const apiResponse = await axios.get('/api/ap', {
            withCredentials: true
          })
          
          // Save raw HTML
          setRawHtml(apiResponse.data)
          
          const parser = new DOMParser()
          const htmlDoc = parser.parseFromString(apiResponse.data, 'text/html')
          const apInput = htmlDoc.getElementById('ap') as HTMLInputElement
          
          if (apInput && apInput.value) {
            try {
              const apData = JSON.parse(apInput.value)
              setApiData(JSON.stringify(apData, null, 2))
              
              if (apData.Tokens && Array.isArray(apData.Tokens)) {
                processTokens(apData.Tokens)
              }
            } catch (e) {
              console.error('Error parsing JSON:', e)
              setApiData(apInput.value)
            }
          } else {
            setApiData(apiResponse.data)
          }
        }
      } else {
        await loginDirect()
      }
    } catch (err) {
      console.error('Error during login:', err)
      setError('Login failed. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  const loginWithProxy = async () => {
    try {
      // First request - query user info (email only)
      const emailFormData = new FormData()
      emailFormData.append('Alias', email)
      
      const userInfoResponse = await axios.post('/Account/QueryUserInfo', emailFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      })
      
      console.log('User info response:', userInfoResponse.data)
      
      // Direct approach to get the page with login form
      const loginPageResponse = await axios.get('/logowanie', {
        withCredentials: true
      })
      
      // Create a parser to extract the verification token
      const parser = new DOMParser()
      const loginPage = parser.parseFromString(loginPageResponse.data, 'text/html')
      const requestVerificationToken = loginPage.querySelector('input[name="__RequestVerificationToken"]') as HTMLInputElement
      
      // Second request - submit login form with all necessary fields
      const loginFormData = new FormData()
      loginFormData.append('Alias', email)
      loginFormData.append('Password', password)
      
      // Add verification token if found
      if (requestVerificationToken && requestVerificationToken.value) {
        loginFormData.append('__RequestVerificationToken', requestVerificationToken.value)
      }
      
      // Convert FormData to URLSearchParams for proper encoding
      const params = new URLSearchParams()
      for (const [key, value] of loginFormData.entries()) {
        params.append(key, value.toString())
      }
      
      // Send as URL encoded form (like a regular form submission)
      const loginResponse = await axios.post('/logowanie', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        withCredentials: true
      })
      
      console.log('Login response:', loginResponse.data)
      
      // Third request - get API data
      const apiResponse = await axios.get('/api/ap', {
        withCredentials: true
      })
      
      // Save raw HTML
      setRawHtml(apiResponse.data)
      
      // Extract data from hidden input
      const htmlDoc = parser.parseFromString(apiResponse.data, 'text/html')
      const apInput = htmlDoc.getElementById('ap') as HTMLInputElement
      
      if (apInput && apInput.value) {
        try {
          const apData = JSON.parse(apInput.value)
          setApiData(JSON.stringify(apData, null, 2))
          
          if (apData.Tokens && Array.isArray(apData.Tokens)) {
            processTokens(apData.Tokens)
          }
        } catch (e) {
          console.error('Error parsing JSON:', e)
          setApiData(apInput.value)
        }
      } else {
        setApiData(apiResponse.data)
      }
    } catch (err) {
      throw err
    }
  }

  const loginDirect = async () => {
    // Direct method using fetch to bypass CORS issues
    try {
      // We'll directly fetch the API AP content
      const response = await fetch('https://eduvulcan.pl/api/ap', {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
        },
        credentials: 'include'
      })
      
      const htmlContent = await response.text()
      
      // Save raw HTML
      setRawHtml(htmlContent)
      
      const parser = new DOMParser()
      const htmlDoc = parser.parseFromString(htmlContent, 'text/html')
      const apInput = htmlDoc.getElementById('ap') as HTMLInputElement
      
      if (apInput && apInput.value) {
        try {
          const apData = JSON.parse(apInput.value)
          setApiData(JSON.stringify(apData, null, 2))
          
          if (apData.Tokens && Array.isArray(apData.Tokens)) {
            processTokens(apData.Tokens)
          }
        } catch (e) {
          console.error('Error parsing JSON:', e)
          setApiData(apInput.value)
        }
      } else {
        // If no ap input found, show the raw HTML
        setApiData(htmlContent)
      }
    } catch (err) {
      throw err
    }
  }

  const handlePasteContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    try {
      // Save raw HTML
      setRawHtml(content)
      
      // Check if pasted content has the ap input
      if (content.includes('id="ap"')) {
        const parser = new DOMParser()
        const htmlDoc = parser.parseFromString(content, 'text/html')
        const apInput = htmlDoc.getElementById('ap') as HTMLInputElement
        
        if (apInput && apInput.value) {
          try {
            const apData = JSON.parse(apInput.value)
            setApiData(JSON.stringify(apData, null, 2))
            
            if (apData.Tokens && Array.isArray(apData.Tokens)) {
              processTokens(apData.Tokens)
            }
          } catch (e) {
            console.error('Error parsing JSON:', e)
            setApiData(apInput.value)
          }
        } else {
          setApiData(content)
        }
      } else {
        // Try parsing as direct JSON
        try {
          const jsonData = JSON.parse(content)
          setApiData(JSON.stringify(jsonData, null, 2))
          
          if (jsonData.Tokens && Array.isArray(jsonData.Tokens)) {
            processTokens(jsonData.Tokens)
          }
        } catch (e) {
          setApiData(content)
        }
      }
    } catch (err) {
      console.error('Error processing pasted content:', err)
      setError('Failed to process the pasted content.')
    }
  }

  return (
    <div className="app-container dark-theme">
      <h1>Eduvulcan API Parser</h1>
      
      <div className="options-container">
        <button 
          className={`option-button ${!showManualSteps ? 'active' : ''}`} 
          onClick={() => setShowManualSteps(false)}
        >
          Automatic Login
        </button>
        <button 
          className={`option-button ${showManualSteps ? 'active' : ''}`} 
          onClick={() => setShowManualSteps(true)}
        >
          Manual Steps
        </button>
      </div>
      
      {!showManualSteps ? (
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
              />
              Use Server Proxy
            </label>
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          {error && <div className="error-message">{error}</div>}
        </form>
      ) : (
        <div className="manual-steps">
          <h2>Manual Steps</h2>
          <ol>
            <li>Open a new browser tab and go to <a href="https://eduvulcan.pl" target="_blank" rel="noopener noreferrer">eduvulcan.pl</a></li>
            <li>Login with your credentials</li>
            <li>Navigate to <a href="https://eduvulcan.pl/api/ap" target="_blank" rel="noopener noreferrer">eduvulcan.pl/api/ap</a></li>
            <li>Right-click on the page and select "View Page Source"</li>
            <li>Copy the entire source code (Ctrl+A then Ctrl+C)</li>
            <li>Paste it below:</li>
          </ol>
          
          <div className="form-group">
            <label htmlFor="manual-input">Paste HTML Source:</label>
            <textarea
              id="manual-input"
              className="manual-input"
              placeholder="Paste the HTML source here..."
              onChange={handlePasteContent}
            />
          </div>
        </div>
      )}
      
      {(apiData || rawHtml) && (
        <div className="display-options">
          <button 
            className={`display-option ${showMode === 'parsed' ? 'active' : ''}`}
            onClick={() => setShowMode('parsed')}
          >
            Parsed Data
          </button>
          <button 
            className={`display-option ${showMode === 'raw' ? 'active' : ''}`}
            onClick={() => setShowMode('raw')}
          >
            Raw HTML
          </button>
        </div>
      )}
      
      {showMode === 'parsed' && tokens.length > 0 && (
        <div className="tokens-container">
          <h2>Tokens:</h2>
          {tokens.map((token, index) => (
            <div key={index} className="token">
              <h3>Token {index + 1}</h3>
              <pre>{token}</pre>
              
              {decodedTokens[index] && (
                <div className="decoded-token">
                  <h4>Decoded Payload:</h4>
                  <pre>{JSON.stringify(decodedTokens[index], null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {showMode === 'parsed' && apiData && (
        <div className="api-data-container">
          <h2>API Data:</h2>
          <pre className="api-data">{apiData}</pre>
        </div>
      )}
      
      {showMode === 'raw' && rawHtml && (
        <div className="raw-html-container">
          <h2>Raw HTML Source:</h2>
          <pre className="raw-html">{rawHtml}</pre>
        </div>
      )}
    </div>
  )
}

export default App
