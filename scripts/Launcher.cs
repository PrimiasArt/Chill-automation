using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ChillAutomation
{
    public class StudioLauncherForm : Form
    {
        private Label lblStatus;
        private Label lblLan;
        private Button btnOpenWeb;
        private Button btnOpenOut;
        private Button btnInstallDeps;
        private Button btnShortcut;
        private TextBox txtLog;
        private Process serverProcess;
        private Timer statusTimer;
        private string rootDir;

        public StudioLauncherForm()
        {
            rootDir = AppDomain.CurrentDomain.BaseDirectory;

            this.Text = "Chill Automation Studio 3.0 — AI Video Engine";
            this.Size = new Size(560, 470);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(11, 15, 25);
            this.ForeColor = Color.FromArgb(243, 246, 252);
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            try
            {
                string icoPath = Path.Combine(rootDir, "public", "chill-studio.ico");
                if (File.Exists(icoPath))
                {
                    this.Icon = new Icon(icoPath);
                }
            }
            catch { }

            BuildUI();

            this.Shown += async (s, e) => await InitializeStudioAsync();
            this.FormClosing += OnLauncherClosing;

            statusTimer = new Timer();
            statusTimer.Interval = 2500;
            statusTimer.Tick += (s, e) => CheckServerStatus();
            statusTimer.Start();
        }

        private void BuildUI()
        {
            // Header Banner
            Panel header = new Panel
            {
                Dock = DockStyle.Top,
                Height = 82,
                BackColor = Color.FromArgb(17, 22, 35)
            };
            header.Paint += (s, e) =>
            {
                e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
                using (LinearGradientBrush brush = new LinearGradientBrush(
                    new Rectangle(0, 0, 560, 4),
                    Color.FromArgb(212, 255, 71),
                    Color.FromArgb(0, 240, 255),
                    0f))
                {
                    e.Graphics.FillRectangle(brush, 0, 78, 560, 4);
                }

                // Draw mini badge icon
                using (SolidBrush badgeBrush = new SolidBrush(Color.FromArgb(212, 255, 71)))
                {
                    e.Graphics.FillEllipse(badgeBrush, 20, 18, 44, 44);
                }
                Point[] playPts = new Point[]
                {
                    new Point(36, 29),
                    new Point(36, 51),
                    new Point(53, 40)
                };
                using (SolidBrush darkBrush = new SolidBrush(Color.FromArgb(11, 15, 25)))
                {
                    e.Graphics.FillPolygon(darkBrush, playPts);
                }
            };

            Label lblTitle = new Label
            {
                Text = "CHILL AUTOMATION STUDIO 3.0",
                Font = new Font("Segoe UI", 13.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(212, 255, 71),
                Location = new Point(78, 16),
                AutoSize = true
            };

            Label lblSub = new Label
            {
                Text = "Hệ thống dựng Video AI Đa Năng 2D & 3D · 30 Repo Stack",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Regular),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(80, 44),
                AutoSize = true
            };

            header.Controls.Add(lblTitle);
            header.Controls.Add(lblSub);
            this.Controls.Add(header);

            // Status Box
            Panel statusCard = new Panel
            {
                Location = new Point(22, 98),
                Size = new Size(500, 64),
                BackColor = Color.FromArgb(20, 27, 45)
            };

            lblStatus = new Label
            {
                Text = "⏳ Đang kiểm tra & khởi động máy chủ Studio...",
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                ForeColor = Color.FromArgb(0, 240, 255),
                Location = new Point(14, 10),
                AutoSize = true
            };

            lblLan = new Label
            {
                Text = "🌐 Mạng nội bộ (LAN): http://" + GetLocalIp() + ":4000",
                Font = new Font("Segoe UI", 9f, FontStyle.Regular),
                ForeColor = Color.FromArgb(203, 213, 225),
                Location = new Point(14, 35),
                AutoSize = true
            };

            statusCard.Controls.Add(lblStatus);
            statusCard.Controls.Add(lblLan);
            this.Controls.Add(statusCard);

            // Primary Action Button
            btnOpenWeb = CreateStyledButton(
                "🚀 Mở Bàn Làm Việc Video AI (http://localhost:4000)",
                new Point(22, 176),
                new Size(500, 48),
                Color.FromArgb(212, 255, 71),
                Color.FromArgb(10, 12, 18),
                11f
            );
            btnOpenWeb.Click += (s, e) => OpenUrl("http://localhost:4000");
            this.Controls.Add(btnOpenWeb);

            // Secondary Row Buttons
            btnOpenOut = CreateStyledButton(
                "📂 Mở Thư Mục Video (out/)",
                new Point(22, 234),
                new Size(244, 40),
                Color.FromArgb(26, 35, 58),
                Color.White,
                9.5f
            );
            btnOpenOut.Click += (s, e) =>
            {
                string outDir = Path.Combine(rootDir, "out");
                Directory.CreateDirectory(outDir);
                Process.Start("explorer.exe", "\"" + outDir + "\"");
            };
            this.Controls.Add(btnOpenOut);

            btnShortcut = CreateStyledButton(
                "📌 Tạo Icon Ra Màn Hình Desktop",
                new Point(278, 234),
                new Size(244, 40),
                Color.FromArgb(26, 35, 58),
                Color.FromArgb(0, 240, 255),
                9.5f
            );
            btnShortcut.Click += (s, e) => CreateDesktopShortcut();
            this.Controls.Add(btnShortcut);

            btnInstallDeps = CreateStyledButton(
                "📦 Cài Đặt / Đồng Bộ Thư Viện Cho Máy Mới (npm install)",
                new Point(22, 284),
                new Size(500, 38),
                Color.FromArgb(22, 30, 48),
                Color.FromArgb(212, 255, 71),
                9.2f
            );
            btnInstallDeps.Click += async (s, e) => await RunNpmInstallAsync();
            this.Controls.Add(btnInstallDeps);

            // Log Console Box
            txtLog = new TextBox
            {
                Multiline = true,
                ReadOnly = true,
                ScrollBars = ScrollBars.Vertical,
                Location = new Point(22, 334),
                Size = new Size(500, 82),
                BackColor = Color.FromArgb(7, 10, 16),
                ForeColor = Color.FromArgb(148, 163, 184),
                BorderStyle = BorderStyle.FixedSingle,
                Font = new Font("Consolas", 8.8f)
            };
            this.Controls.Add(txtLog);
        }

        private Button CreateStyledButton(string text, Point loc, Size size, Color back, Color fore, float fontSize)
        {
            Button btn = new Button
            {
                Text = text,
                Location = loc,
                Size = size,
                BackColor = back,
                ForeColor = fore,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", fontSize, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btn.FlatAppearance.BorderColor = Color.FromArgb(45, 59, 94);
            btn.FlatAppearance.BorderSize = 1;
            return btn;
        }

        private void AppendLog(string msg)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action<string>(AppendLog), msg);
                return;
            }
            txtLog.AppendText("[" + DateTime.Now.ToString("HH:mm:ss") + "] " + msg + Environment.NewLine);
        }

        private async Task InitializeStudioAsync()
        {
            string nodeModules = Path.Combine(rootDir, "node_modules");
            if (!Directory.Exists(nodeModules))
            {
                AppendLog("Phát hiện máy mới chưa có node_modules. Đang tự động cài đặt...");
                await RunNpmInstallAsync();
            }

            if (!IsPortListening(4000))
            {
                StartStudioServer();
                await Task.Delay(1200);
            }
            else
            {
                AppendLog("Máy chủ Studio đã chạy sẵn trên cổng 4000.");
            }

            CheckServerStatus();
            AppendLog("Đang mở giao diện làm việc http://localhost:4000 ...");
            OpenUrl("http://localhost:4000");
        }

        private void StartStudioServer()
        {
            try
            {
                AppendLog("Đang khởi động node studio-server.mjs...");
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = "studio-server.mjs",
                    WorkingDirectory = rootDir,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    StandardOutputEncoding = Encoding.UTF8,
                    StandardErrorEncoding = Encoding.UTF8
                };

                serverProcess = new Process { StartInfo = psi, EnableRaisingEvents = true };
                serverProcess.OutputDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrWhiteSpace(e.Data)) AppendLog(e.Data);
                };
                serverProcess.ErrorDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrWhiteSpace(e.Data)) AppendLog(e.Data);
                };
                serverProcess.Start();
                serverProcess.BeginOutputReadLine();
                serverProcess.BeginErrorReadLine();
            }
            catch (Exception ex)
            {
                AppendLog("Lỗi khởi động Node.js: " + ex.Message);
            }
        }

        private async Task RunNpmInstallAsync()
        {
            btnInstallDeps.Enabled = false;
            lblStatus.Text = "📦 Đang cài đặt 30 thư viện đồ họa & âm thanh (npm install)...";
            lblStatus.ForeColor = Color.FromArgb(250, 204, 21);
            AppendLog("Bắt đầu chạy: npm.cmd install --legacy-peer-deps ...");

            await Task.Run(() =>
            {
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c npm.cmd install --legacy-peer-deps",
                        WorkingDirectory = rootDir,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    };
                    using (Process p = Process.Start(psi))
                    {
                        p.OutputDataReceived += (s, e) =>
                        {
                            if (!string.IsNullOrWhiteSpace(e.Data)) AppendLog(e.Data);
                        };
                        p.ErrorDataReceived += (s, e) =>
                        {
                            if (!string.IsNullOrWhiteSpace(e.Data)) AppendLog(e.Data);
                        };
                        p.BeginOutputReadLine();
                        p.BeginErrorReadLine();
                        p.WaitForExit();
                    }
                }
                catch (Exception ex)
                {
                    AppendLog("Lỗi npm install: " + ex.Message);
                }
            });

            AppendLog("✓ Đã hoàn tất cài đặt thư viện!");
            btnInstallDeps.Enabled = true;
            CheckServerStatus();
        }

        private void CheckServerStatus()
        {
            if (IsPortListening(4000))
            {
                lblStatus.Text = "🟢 Máy chủ Studio Đang Hoạt Động — http://localhost:4000";
                lblStatus.ForeColor = Color.FromArgb(74, 222, 128);
            }
            else
            {
                lblStatus.Text = "🟡 Máy chủ đang khởi động...";
                lblStatus.ForeColor = Color.FromArgb(250, 204, 21);
            }
        }

        private bool IsPortListening(int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    var result = client.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(250));
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        private void CreateDesktopShortcut()
        {
            try
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string shortcutPath = Path.Combine(desktop, "Chill Automation Studio.lnk");
                string exePath = Application.ExecutablePath;
                string icoPath = Path.Combine(rootDir, "public", "chill-studio.ico");

                string vbs = "Set oWS = WScript.CreateObject(\"WScript.Shell\")\r\n" +
                             "Set oLink = oWS.CreateShortcut(\"" + shortcutPath + "\")\r\n" +
                             "oLink.TargetPath = \"" + exePath + "\"\r\n" +
                             "oLink.WorkingDirectory = \"" + rootDir + "\"\r\n" +
                             "oLink.Description = \"Chill Automation Studio 3.0 - AI Video Engine\"\r\n" +
                             (File.Exists(icoPath) ? "oLink.IconLocation = \"" + icoPath + "\"\r\n" : "") +
                             "oLink.Save\r\n";

                string tempVbs = Path.Combine(Path.GetTempPath(), "create_chill_shortcut.vbs");
                File.WriteAllText(tempVbs, vbs, Encoding.Unicode);
                Process vbsProc = Process.Start(new ProcessStartInfo("wscript.exe", "\"" + tempVbs + "\"") { CreateNoWindow = true, UseShellExecute = false });
                if (vbsProc != null)
                {
                    vbsProc.WaitForExit();
                }
                File.Delete(tempVbs);

                AppendLog("✓ Đã tạo biểu tượng 'Chill Automation Studio' ngoài màn hình Desktop!");
                MessageBox.Show(
                    "Đã tạo biểu tượng 'Chill Automation Studio' có Logo ngoài màn hình Desktop thành công!",
                    "Chill Automation Studio",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
            catch (Exception ex)
            {
                AppendLog("Không thể tạo shortcut: " + ex.Message);
            }
        }

        private void OpenUrl(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch { }
        }

        private string GetLocalIp()
        {
            try
            {
                var host = Dns.GetHostEntry(Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(ip))
                    {
                        return ip.ToString();
                    }
                }
            }
            catch { }
            return "localhost";
        }

        private void OnLauncherClosing(object sender, FormClosingEventArgs e)
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    serverProcess.Kill();
                }
            }
            catch { }
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new StudioLauncherForm());
        }
    }
}
