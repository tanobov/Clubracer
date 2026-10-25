"""Windows desktop host. Run with iRacing in borderless/windowed mode."""
import json
import sys
from pathlib import Path

import irsdk
from PySide6.QtCore import Qt, QTimer, QUrl
from PySide6.QtGui import QColor, QShortcut, QKeySequence
from PySide6.QtWidgets import QApplication
from PySide6.QtWebEngineWidgets import QWebEngineView

ROOT = Path(__file__).resolve().parent.parent


def snapshot(sdk, countries):
    info = sdk['DriverInfo']
    player = info['DriverCarIdx']
    entries = info['Drivers']
    distances = sdk['CarIdxLapDistPct']
    positions = sdk['CarIdxPosition']
    surfaces = sdk['CarIdxTrackSurface']
    laps = sdk['CarIdxBestLapTime']
    if player < 0 or distances[player] < 0:
        return None
    reference_lap = laps[player]
    if reference_lap <= 0:
        valid = [t for t in laps if t > 0]
        reference_lap = min(valid) if valid else 0
    drivers = []
    for entry in entries:
        idx = entry['CarIdx']
        if entry.get('IsSpectator') or surfaces[idx] < 0 or distances[idx] < 0:
            continue
        name = entry.get('UserName', '').split(' ', 1)
        # Wrap into the nearest half lap, independent of race lap count.
        distance = (distances[player] - distances[idx] + 0.5) % 1 - 0.5
        drivers.append(dict(
            id=idx, position=positions[idx] or None,
            number=entry.get('CarNumber', ''), firstName=name[0],
            lastName=name[1] if len(name) > 1 else '',
            countryCode=countries.get(str(entry.get('UserID')), None),
            gapSeconds=distance * reference_lap if reference_lap > 0 else None,
        ))
    return dict(playerId=player, drivers=drivers)


class Overlay(QWebEngineView):
    def __init__(self):
        super().__init__()
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.Tool)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.page().setBackgroundColor(QColor(0, 0, 0, 0))
        self.resize(590, 510)
        self.setWindowTitle('Clubracer Relative')
        self.sdk = irsdk.IRSDK()
        self.countries = {}
        config = Path(__file__).with_name('countries.json')
        if config.exists():
            self.countries = json.loads(config.read_text(encoding='utf-8'))
        self.ready = False
        self.loadFinished.connect(self.loaded)
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.refresh)
        self.timer.start(250)
        self.close_shortcut = QShortcut(QKeySequence('Esc'), self)
        self.close_shortcut.activated.connect(self.close)
        self.drag_shortcut = QShortcut(QKeySequence('Ctrl+M'), self)
        self.drag_shortcut.activated.connect(lambda: self.windowHandle().startSystemMove())

    def loaded(self, ok):
        self.ready = ok

    def refresh(self):
        if not self.ready:
            return
        data = None
        try:
            if not self.sdk.is_initialized:
                self.sdk.startup()
            if self.sdk.is_initialized and self.sdk.is_connected:
                self.sdk.freeze_var_buffer_latest()
                data = snapshot(self.sdk, self.countries)
        except (KeyError, IndexError, TypeError, ValueError, RuntimeError):
            data = None
        self.page().runJavaScript('window.updateTelemetry(' + json.dumps(data, allow_nan=False) + ')')

    def closeEvent(self, event):
        self.timer.stop()
        self.sdk.shutdown()
        super().closeEvent(event)


if __name__ == '__main__':
    if sys.platform != 'win32':
        raise SystemExit('Este lanzador requiere Windows e iRacing local.')
    # Qt WebEngine treats local ES modules as CORS requests. Serve the UI on
    # loopback so Chromium uses its normal module security rules.
    import functools
    import http.server
    import threading
    server = http.server.ThreadingHTTPServer(
        ('127.0.0.1', 0),
        functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT)),
    )
    threading.Thread(target=server.serve_forever, daemon=True).start()
    app = QApplication(sys.argv)
    overlay = Overlay()
    overlay.load(QUrl(f'http://127.0.0.1:{server.server_port}/?native=1'))
    overlay.show()
    result = app.exec()
    server.shutdown()
    sys.exit(result)
