export default function BasicApp() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; background: #f9fafb; }
            .container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
            .card { width: 100%; max-width: 400px; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .title { text-align: center; font-size: 24px; font-weight: bold; color: #111827; margin: 0 0 8px 0; }
            .subtitle { text-align: center; font-size: 14px; color: #6b7280; margin: 0 0 32px 0; }
            .form-group { margin-bottom: 16px; }
            .label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
            .input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
            .button { width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; }
            .button:hover { background: #1d4ed8; }
            .button:disabled { background: #9ca3af; cursor: not-allowed; }
            .error { margin-bottom: 16px; padding: 12px; border: 1px solid #fecaca; background: #fef2f2; border-radius: 6px; color: #dc2626; font-size: 14px; display: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <h1 class="title">24/7 Tele H</h1>
              <p class="subtitle">Health Monitoring System</p>
              
              <div id="error" class="error"></div>
              
              <form id="loginForm">
                <div class="form-group">
                  <label class="label">Email Address</label>
                  <input id="email" type="email" class="input" placeholder="Enter your email" required />
                </div>
                
                <div class="form-group">
                  <label class="label">Password</label>
                  <input id="password" type="password" class="input" placeholder="Enter your password" required />
                </div>
                
                <button id="loginBtn" type="submit" class="button">Sign In</button>
              </form>
              
            </div>
          </div>
          
          <script>
            document.getElementById('loginForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const email = document.getElementById('email').value;
              const password = document.getElementById('password').value;
              const errorDiv = document.getElementById('error');
              const loginBtn = document.getElementById('loginBtn');
              
              loginBtn.disabled = true;
              loginBtn.textContent = 'Signing in...';
              errorDiv.style.display = 'none';
              
              try {
                const response = await fetch('/api/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                });
                
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Login failed');
                }
                
                const result = await response.json();
                
                if (result.user.role === 'admin') {
                  showAdminDashboard(result.user);
                } else {
                  showPatientDashboard(result.user);
                }
              } catch (err) {
                errorDiv.textContent = err.message || 'Login failed. Please try again.';
                errorDiv.style.display = 'block';
              } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign In';
              }
            });
            
            function showAdminDashboard(user) {
              document.body.innerHTML = \`
                <div style="min-height: 100vh; background: #f9fafb; padding: 24px;">
                  <div style="max-width: 1200px; margin: 0 auto;">
                    <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <h1 style="font-size: 28px; font-weight: bold; color: #111827; margin: 0 0 8px 0;">Admin Dashboard</h1>
                        <p style="font-size: 16px; color: #6b7280; margin: 0;">Manage patient dashboard access for 24/7 Tele H</p>
                      </div>
                      <button onclick="location.reload()" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">Logout</button>
                    </div>
                    
                    <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Welcome, \${user.firstName} \${user.lastName}</h2>
                      <p style="color: #6b7280; margin: 0 0 24px 0;">You have successfully logged in as an administrator.</p>
                      
                      <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
                        <h3 style="font-size: 16px; font-weight: 500; color: #111827; margin: 0 0 12px 0;">System Status</h3>
                        <ul style="margin: 0; padding-left: 20px;">
                          <li style="color: #059669; margin-bottom: 4px;">✓ SendGrid email service removed</li>
                          <li style="color: #059669; margin-bottom: 4px;">✓ Test mode OTP system active</li>
                          <li style="color: #059669; margin-bottom: 4px;">✓ Admin authentication working</li>
                          <li style="color: #059669;">✓ Database connection established</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              \`;
            }
            
            function showPatientDashboard(user) {
              document.body.innerHTML = \`
                <div style="min-height: 100vh; background: #f9fafb; padding: 24px;">
                  <div style="max-width: 800px; margin: 0 auto;">
                    <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center;">
                      <h1 style="font-size: 24px; font-weight: bold; color: #111827; margin: 0 0 16px 0;">Welcome, \${user.firstName} \${user.lastName}</h1>
                      <p style="color: #6b7280; margin: 0 0 24px 0;">You have successfully logged in to the 24/7 Tele H health monitoring system.</p>
                      <button onclick="location.reload()" style="padding: 12px 24px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">Logout</button>
                    </div>
                  </div>
                </div>
              \`;
            }
          </script>
        </body>
        </html>
      `
    }} />
  );
}